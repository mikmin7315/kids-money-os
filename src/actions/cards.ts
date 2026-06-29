"use server";

import { revalidatePath } from "next/cache";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CardFormState = { ok: boolean; message: string };

export async function applyCardAction(
  _prev: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const auth = await requireParentSession();
  const childId = String(formData.get("child_id") ?? "");
  if (!childId) return { ok: false, message: "아이를 선택해주세요." };

  const supabase = await getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("card_applications")
    .select("id, status")
    .eq("parent_id", auth.user!.id)
    .eq("child_id", childId)
    .not("status", "in", '("cancelled","rejected")')
    .maybeSingle();

  if (existing) return { ok: false, message: "이미 신청 중이거나 발급된 카드가 있어요." };

  const { error } = await supabase.from("card_applications").insert({
    parent_id: auth.user!.id,
    child_id: childId,
    status: "initiated",
    partner: "mock",
  });
  if (error) return { ok: false, message: "신청에 실패했어요." };

  revalidatePath("/cards");
  revalidatePath("/cards/status");
  return { ok: true, message: "카드 신청이 접수됐어요." };
}

export async function toggleCardAction(
  _prev: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const auth = await requireParentSession();
  const cardId = String(formData.get("card_id") ?? "");
  const enabled = formData.get("is_enabled") === "true";

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("child_cards")
    .update({ is_enabled: enabled })
    .eq("id", cardId)
    .eq("parent_id", auth.user!.id);
  if (error) return { ok: false, message: "변경에 실패했어요." };

  revalidatePath("/cards");
  return { ok: true, message: enabled ? "카드를 활성화했어요." : "카드를 일시 정지했어요." };
}

export async function updateCardLimitsAction(
  _prev: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const auth = await requireParentSession();
  const cardId = String(formData.get("card_id") ?? "");
  const daily = parseInt(String(formData.get("daily_limit") ?? "0"), 10);
  const monthly = parseInt(String(formData.get("monthly_limit") ?? "0"), 10);

  if (!daily || !monthly || daily > monthly) {
    return { ok: false, message: "한도를 올바르게 입력해주세요. (일 한도 ≤ 월 한도)" };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("child_cards")
    .update({ daily_limit: daily, monthly_limit: monthly })
    .eq("id", cardId)
    .eq("parent_id", auth.user!.id);
  if (error) return { ok: false, message: "한도 변경에 실패했어요." };

  revalidatePath("/cards");
  return { ok: true, message: "한도를 변경했어요." };
}

export async function reportCardLostAction(
  _prev: CardFormState,
  formData: FormData,
): Promise<CardFormState> {
  const auth = await requireParentSession();
  const cardId = String(formData.get("card_id") ?? "");

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("child_cards")
    .update({ status: "lost", is_enabled: false })
    .eq("id", cardId)
    .eq("parent_id", auth.user!.id);
  if (error) return { ok: false, message: "분실 신고에 실패했어요." };

  revalidatePath("/cards");
  return { ok: true, message: "카드를 즉시 정지하고 분실 신고했어요." };
}
