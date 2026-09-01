"use server";

import { revalidatePath } from "next/cache";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getKonaTransactions, KonaTransactionItem } from "@/lib/konaplate/cards";

// KONA PLATE API에서 거래 내역을 가져와 card_transactions에 동기화
export async function syncCardTransactionsAction(cardId: string): Promise<{ ok: boolean; message: string; count?: number }> {
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  // 카드 + 코나플레이트 userId 확인
  const { data: card } = await supabase
    .from("child_cards")
    .select("id, child_id, application_id")
    .eq("id", cardId)
    .eq("parent_id", auth.user!.id)
    .single();
  if (!card) return { ok: false, message: "카드를 찾을 수 없어요." };

  const { data: app } = await supabase
    .from("card_applications")
    .select("external_reference, notes")
    .eq("id", card.application_id!)
    .single();
  if (!app?.external_reference) return { ok: false, message: "카드 연동 정보가 없어요." };

  const notes = typeof app.notes === "string" ? JSON.parse(app.notes) : (app.notes ?? {});
  const par: string = notes.par ?? "";
  if (!par) return { ok: false, message: "카드 PAR 정보가 없어요." };

  const userId = Number(app.external_reference);

  // 최근 3개월 조회
  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    .toISOString().slice(0, 10).replace(/-/g, "");
  const toDate = now.toISOString().slice(0, 10).replace(/-/g, "");

  let txList: KonaTransactionItem[];
  try {
    const result = await getKonaTransactions(userId, par, fromDate, toDate);
    txList = result.transactionInfo;
  } catch (err) {
    return { ok: false, message: `코나플레이트 API 오류: ${String(err).slice(0, 80)}` };
  }

  if (!txList?.length) return { ok: true, message: "새 거래 내역이 없어요.", count: 0 };

  // 중복 방지: 기존 transactionId 목록 조회
  const { data: existing } = await supabase
    .from("card_transactions")
    .select("raw_payload")
    .eq("card_id", card.id);

  const existingIds = new Set(
    (existing ?? []).map((r) => {
      const p = r.raw_payload as Record<string, unknown> | null;
      return String(p?.approvalCode ?? "");
    }).filter(Boolean)
  );

  const newTxs = txList.filter((t: KonaTransactionItem) => !existingIds.has(t.approvalCode));
  if (!newTxs.length) return { ok: true, message: "이미 최신 상태예요.", count: 0 };

  const rows = newTxs.map((t: KonaTransactionItem) => ({
    card_id: card.id,
    child_id: card.child_id,
    merchant_name: t.merchantName || "가맹점 미상",
    merchant_category: mapCategory(""),
    amount: Math.abs(t.trAmount),
    status: mapStatus(t.authCancelType),
    approved_at: parseKonaTime(t.approvalDateTime),
    raw_payload: t as unknown as Record<string, unknown>,
  }));

  const { error } = await supabase.from("card_transactions").insert(rows);
  if (error) return { ok: false, message: "저장 중 오류가 발생했어요." };

  revalidatePath("/cards/transactions");
  return { ok: true, message: `${newTxs.length}건 동기화됐어요.`, count: newTxs.length };
}

function parseKonaTime(raw: string): string {
  if (raw.length === 14) {
    return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}T`
      + `${raw.slice(8,10)}:${raw.slice(10,12)}:${raw.slice(12,14)}+09:00`;
  }
  return new Date().toISOString();
}

function mapStatus(s: string): string {
  const m: Record<string, string> = {
    APPROVED: "approved", APPROVE: "approved",
    CANCELLED: "cancelled", CANCEL: "cancelled",
    REVERSED: "reversed", REVERSE: "reversed",
    DECLINED: "declined", DECLINE: "declined",
  };
  return m[s?.toUpperCase()] ?? "approved";
}

function mapCategory(raw: string): string {
  const map: Record<string, string> = {
    CVS: "convenience", CONVENIENCE: "convenience",
    FOOD: "food", RESTAURANT: "food", CAFE: "food",
    EDUCATION: "education", BOOK: "education",
    TRANSPORT: "transport", BUS: "transport", SUBWAY: "transport",
    ENTERTAINMENT: "entertainment", GAME: "entertainment",
    SHOPPING: "shopping", CLOTHES: "shopping",
    MART: "mart", SUPERMARKET: "mart",
    PHARMACY: "pharmacy", MEDICAL: "medical",
  };
  return map[raw?.toUpperCase()] ?? raw?.toLowerCase() ?? "기타";
}
