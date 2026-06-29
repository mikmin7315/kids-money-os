import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trimStart().startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        if (separator < 0) return [line.trim(), ""];
        return [
          line.slice(0, separator).trim(),
          line
            .slice(separator + 1)
            .trim()
            .replace(/^(['"])(.*)\1$/, "$2"),
        ];
      }),
  );
}

const fileEnv = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...loadEnvFile(".env.production"),
  ...loadEnvFile(".env.production.local"),
};
const env = { ...fileEnv, ...process.env };

function required(name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function propertiesFor(spec, table) {
  return spec.definitions?.[table]?.properties ?? spec.components?.schemas?.[table]?.properties ?? {};
}

try {
  const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");

  assert(
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl),
    "NEXT_PUBLIC_SUPABASE_URL must be an HTTPS Supabase project URL.",
  );

  console.log("pre-promote: required backend configuration is set");

  let response = null;
  let networkError = null;
  for (let attempt = 1; attempt <= 3 && !response; attempt += 1) {
    try {
      response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          accept: "application/openapi+json",
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      networkError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  if (!response) {
    throw new Error(
      `Supabase backend is unreachable: ${networkError instanceof Error ? networkError.message : "network error"}`,
    );
  }

  if (!response.ok) {
    const reason =
      response.status === 401
        ? "service role authentication failed"
        : response.status === 403
          ? "service role access was forbidden"
          : "backend request failed";
    throw new Error(`Supabase ${reason} with HTTP ${response.status}.`);
  }

  const spec = await response.json();
  const definitions = spec.definitions ?? spec.components?.schemas ?? {};
  const paths = spec.paths ?? {};
  const requiredTables = [
    "profiles",
    "children",
    "behavior_rules",
    "behavior_logs",
    "behavior_scores",
    "allowance_rules",
    "wallet_snapshots",
    "money_transactions",
    "interest_policies",
    "interest_rate_events",
    "borrow_requests",
    "borrow_repayments",
    "borrow_conditions",
    "monthly_reports",
    "peer_stats",
    "notifications",
    // P0 migrations
    "parent_wallets",
    "parent_wallet_charges",
    "interest_rate_confirmations",
    "cash_spend_requests",
    "allowance_executions",
    // P1
    "settlement_runs",
    "settlement_child_runs",
  ];
  const requiredColumns = {
    profiles: ["consent_version", "consent_at"],
    children: ["pin_failed_attempts", "pin_locked_until", "deleted_at"],
    behavior_logs: ["behavior_rule_id", "status", "approved_by", "photo_path"],
    behavior_rules: ["rule_category", "monthly_target_rate"],
    money_transactions: ["related_behavior_log_id", "related_borrow_request_id", "created_by"],
    borrow_requests: ["repayment_mode", "installment_count", "interest_rate", "approved_by_parent", "repaid_at"],
    borrow_repayments: ["borrow_request_id", "due_date", "amount", "paid_amount", "status"],
    notifications: ["parent_id", "child_id", "target", "type", "title", "body", "is_read", "created_at"],
    // P1
    parent_wallet_charges: ["reviewed_by", "balance_before", "balance_after"],
  };
  const requiredRpcs = [
    "approve_behavior_log",
    "approve_borrow_request",
    "consume_child_pin_attempt",
    "change_profile_role",
    "get_app_data_bundle",
    // P0 migrations
    "save_parent_bank_account",
    "give_allowance_from_parent_wallet",
    "confirm_interest_rate",
    "approve_cash_spend",
    "reject_cash_spend",
    "approve_parent_wallet_charge",
    "reject_parent_wallet_charge",
    // P0 나머지 기능
    "repay_borrow_installment",
    "process_scheduled_allowances",
    "update_child",
    "delete_child",
    // P1
    "run_monthly_settlement",
  ];

  for (const table of requiredTables) {
    assert(definitions[table], `Required table is missing from PostgREST: ${table}`);
  }
  console.log(`pre-promote: ${requiredTables.length} required tables are available`);

  for (const [table, columns] of Object.entries(requiredColumns)) {
    const properties = propertiesFor(spec, table);
    for (const column of columns) {
      assert(properties[column], `Required column is missing: ${table}.${column}`);
    }
  }
  console.log("pre-promote: migration-specific columns are available");

  for (const rpc of requiredRpcs) {
    assert(paths[`/rpc/${rpc}`], `Required RPC is missing from PostgREST: ${rpc}`);
  }
  console.log(`pre-promote: ${requiredRpcs.length} required RPCs are available`);

  console.log("pre-promote: Supabase backend release gate passed");
  console.warn("pre-promote advisory: run supabase/release-preflight.sql before production promotion.");
} catch (error) {
  console.error(`pre-promote failure: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exit(1);
}
