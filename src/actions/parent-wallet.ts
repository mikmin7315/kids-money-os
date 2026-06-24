"use server";

import { revalidatePath } from "next/cache";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/data";

export type ParentWallet = {
  balance: number;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
};

export type ChargeResult = { ok: boolean; message: string };

// 부모 지갑 조회 (없으면 자동 생성)
export async function getParentWalletAction(): Promise<ParentWallet> {
  if (isDemoMode()) {
    return { balance: 150000, bankName: "카카오뱅크", accountNumber: "3333-01-1234567", accountHolder: "김부모" };
  }

  const auth = await requireParentSession();
  if (!auth.user) return { balance: 0, bankName: null, accountNumber: null, accountHolder: null };
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("parent_wallets")
    .select("balance, bank_name, account_number, account_holder")
    .eq("parent_id", auth.user.id)
    .maybeSingle();

  if (!data) {
    // 최초 접근 시 생성
    const { data: created } = await supabase
      .from("parent_wallets")
      .insert({ parent_id: auth.user.id, balance: 0 })
      .select("balance, bank_name, account_number, account_holder")
      .single();
    return {
      balance: created?.balance ?? 0,
      bankName: null,
      accountNumber: null,
      accountHolder: null,
    };
  }

  return {
    balance: data.balance ?? 0,
    bankName: data.bank_name ?? null,
    accountNumber: data.account_number ?? null,
    accountHolder: data.account_holder ?? null,
  };
}

// 계좌 정보 저장
export async function saveParentBankAccountAction(
  _prev: ChargeResult,
  formData: FormData,
): Promise<ChargeResult> {
  const auth = await requireParentSession();

  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").replace(/\s/g, "");
  const accountHolder = String(formData.get("accountHolder") ?? "").trim();

  if (!bankName || !accountNumber || !accountHolder) {
    return { ok: false, message: "은행명, 계좌번호, 예금주를 모두 입력해주세요." };
  }

  if (isDemoMode()) {
    revalidatePath("/settings/wallet");
    return { ok: true, message: "계좌 정보가 저장되었어요." };
  }

  if (!auth.user) return { ok: false, message: "로그인이 필요해요." };
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("parent_wallets")
    .upsert(
      { parent_id: auth.user.id, bank_name: bankName, account_number: accountNumber, account_holder: accountHolder },
      { onConflict: "parent_id" },
    );

  if (error) return { ok: false, message: "저장 중 오류가 발생했어요." };
  revalidatePath("/settings/wallet");
  revalidatePath("/");
  return { ok: true, message: "계좌 정보가 저장되었어요." };
}

// 수동 충전 (실제 이체 확인 후 관리자가 처리하는 방식 or 데모용 즉시 충전)
export async function chargeParentWalletAction(
  _prev: ChargeResult,
  formData: FormData,
): Promise<ChargeResult> {
  const auth = await requireParentSession();
  const amount = Math.floor(Number(formData.get("amount") ?? 0));

  if (!amount || amount < 1000) return { ok: false, message: "최소 충전 금액은 1,000원이에요." };
  if (amount > 1000000) return { ok: false, message: "1회 최대 충전은 100만 원이에요." };

  if (isDemoMode()) {
    revalidatePath("/");
    revalidatePath("/settings/wallet");
    return { ok: true, message: `${amount.toLocaleString()}원이 충전되었어요. (데모 모드)` };
  }

  if (!auth.user) return { ok: false, message: "로그인이 필요해요." };
  const supabase = await getSupabaseServerClient();

  // 충전 내역 기록
  await supabase.from("parent_wallet_charges").insert({
    parent_id: auth.user.id,
    amount,
    method: "bank_transfer",
    status: "paid",
  });

  // 잔액 증가 (원자적 업데이트)
  const { error } = await supabase.rpc("increment_parent_wallet_balance", {
    p_parent_id: auth.user.id,
    p_amount: amount,
  }).single();

  if (error) {
    // RPC 없으면 일반 upsert (race condition 가능하지만 MVP 수준)
    const { data: wallet } = await supabase
      .from("parent_wallets")
      .select("balance")
      .eq("parent_id", auth.user.id)
      .maybeSingle();

    await supabase
      .from("parent_wallets")
      .upsert({ parent_id: auth.user.id, balance: (wallet?.balance ?? 0) + amount }, { onConflict: "parent_id" });
  }

  revalidatePath("/");
  revalidatePath("/settings/wallet");
  return { ok: true, message: `${amount.toLocaleString()}원이 충전되었어요.` };
}

// 용돈 지급 시 부모 잔액 차감
export async function deductParentWalletAction(amount: number): Promise<{ ok: boolean }> {
  if (isDemoMode()) return { ok: true };

  const auth = await requireParentSession();
  if (!auth.user) return { ok: false };
  const supabase = await getSupabaseServerClient();

  const { data: wallet } = await supabase
    .from("parent_wallets")
    .select("balance")
    .eq("parent_id", auth.user.id)
    .maybeSingle();

  const current = wallet?.balance ?? 0;
  if (current < amount) return { ok: false };

  await supabase
    .from("parent_wallets")
    .update({ balance: current - amount })
    .eq("parent_id", auth.user.id);

  return { ok: true };
}
