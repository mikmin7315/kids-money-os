import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildPeerStatsRows,
  getMondayDate,
  minimumPeerSampleSize,
  type BehaviorLogRow,
  type ChildRow,
  type TransactionRow,
} from "./aggregate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const pageSize = 1000;

function getSecret(primaryName: string, fallbackName: string): string {
  return Deno.env.get(primaryName) ?? Deno.env.get(fallbackName) ?? "";
}

function verifyCronSecret(req: Request): boolean {
  const cronSecret = getSecret("CRON_SECRET", "cron_secret");
  if (!cronSecret) return true;

  const incoming = req.headers.get("x-cron-secret") ?? "";
  if (incoming.length !== cronSecret.length) return false;

  const encoder = new TextEncoder();
  const incomingBytes = encoder.encode(incoming.padEnd(64));
  const secretBytes = encoder.encode(cronSecret.padEnd(64));
  let difference = 0;
  for (let index = 0; index < incomingBytes.length; index += 1) {
    difference |= incomingBytes[index] ^ secretBytes[index];
  }
  return difference === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  if (!verifyCronSecret(req)) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  const supabaseUrl = getSecret("SUPABASE_URL", "supabase_url");
  const serviceRoleKey = getSecret("SUPABASE_SERVICE_ROLE_KEY", "supabase_service_role_key");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: "Missing Supabase function secrets." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const currentYear = nowKst.getUTCFullYear();
  const currentMonth = nowKst.getUTCMonth();
  const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const today = nowKst.toISOString().slice(0, 10);
  const weekStart = getMondayDate(nowKst);

  try {
    const [children, transactions, behaviorLogs] = await Promise.all([
      fetchChildren(supabase),
      fetchTransactions(supabase, monthStart, today),
      fetchBehaviorLogs(supabase, monthStart, today),
    ]);

    const rows = buildPeerStatsRows(
      children,
      transactions,
      behaviorLogs,
      currentYear,
      weekStart,
    );

    if (rows.length > 0) {
      const { error } = await supabase
        .from("peer_stats")
        .upsert(rows, { onConflict: "week_start,age_group,region" });
      if (error) throw error;
    }

    return jsonResponse({
      ok: true,
      weekStart,
      cohortsUpserted: rows.length,
      cohortsSkipped: 3 - rows.length,
      childrenProcessed: children.length,
      minimumSampleSize: minimumPeerSampleSize,
    });
  } catch (error) {
    console.error("aggregate-peer-stats failed:", error);
    return jsonResponse(
      { ok: false, error: error instanceof Error ? error.message : "Peer stats aggregation failed." },
      500,
    );
  }
});

type SupabaseClient = ReturnType<typeof createClient>;

async function fetchChildren(supabase: SupabaseClient): Promise<ChildRow[]> {
  const rows: ChildRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("children")
      .select("id,birth_year")
      .is("deleted_at", null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as ChildRow[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function fetchTransactions(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
): Promise<TransactionRow[]> {
  const rows: TransactionRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("money_transactions")
      .select("child_id,type,amount")
      .in("type", ["allowance", "reward", "save", "spend"])
      .gte("tx_date", startDate)
      .lte("tx_date", endDate)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as TransactionRow[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function fetchBehaviorLogs(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
): Promise<BehaviorLogRow[]> {
  const rows: BehaviorLogRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("behavior_logs")
      .select("child_id,status")
      .gte("behavior_date", startDate)
      .lte("behavior_date", endDate)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as BehaviorLogRow[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
