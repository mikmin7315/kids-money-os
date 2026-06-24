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
    return {
      balance: 0,
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
  const { error } = await supabase.rpc("save_parent_bank_account", {
    p_bank_name: bankName,
    p_account_number: accountNumber,
    p_account_holder: accountHolder,
  });

  if (error) return { ok: false, message: "저장 중 오류가 발생했어요." };
  revalidatePath("/settings/wallet");
  revalidatePath("/");
  return { ok: true, message: "계좌 정보가 저장되었어요." };
}

// 실제 이체 확인 전에는 잔액을 변경하지 않고 충전 요청만 생성한다.
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
    return { ok: true, message: `${amount.toLocaleString()}원 충전 요청이 접수되었어요. (데모 모드)` };
  }

  if (!auth.user) return { ok: false, message: "로그인이 필요해요." };
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from("parent_wallet_charges").insert({
    parent_id: auth.user.id,
    amount,
    method: "bank_transfer",
    status: "pending",
  });

  if (error) return { ok: false, message: "충전 요청을 접수하지 못했어요. 잠시 후 다시 시도해주세요." };

  revalidatePath("/settings/wallet");
  return { ok: true, message: `${amount.toLocaleString()}원 충전 요청이 접수되었어요. 이체 확인 후 잔액에 반영돼요.` };
}
