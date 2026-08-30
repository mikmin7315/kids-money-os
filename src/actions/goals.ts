"use server";

import { revalidatePath } from "next/cache";
import { requireParentSession, getChildModeContext } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { invalidateAppData, type GoalRow } from "@/lib/data";

export type { GoalRow };

type ActionResult<T = void> = { ok: boolean; data?: T; error?: string };

// ────────────────────────────────────────────────────────────
// 목표 조회 — 부모 또는 아이 모드 모두 사용
// ────────────────────────────────────────────────────────────

export async function getChildGoalsAction(childId: string): Promise<ActionResult<GoalRow[]>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("goals")
    .select("id,child_id,title,target_amount,current_amount,deadline,image_emoji,status,created_at,achieved_at")
    .eq("child_id", childId)
    .in("status", ["active", "achieved"])
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as GoalRow[] };
}

// ────────────────────────────────────────────────────────────
// 목표 생성 — 부모만
// ────────────────────────────────────────────────────────────

export async function createGoalAction(input: {
  childId: string;
  title: string;
  targetAmount: number;
  deadline?: string | null;
  emoji?: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  const { childId, title, targetAmount, deadline, emoji } = input;

  if (!title.trim()) return { ok: false, error: "목표 이름을 입력해주세요." };
  if (targetAmount < 100 || targetAmount > 100_000_000) {
    return { ok: false, error: "목표 금액은 100원 ~ 1억원 사이로 입력해주세요." };
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("goals")
    .insert({
      child_id: childId,
      title: title.trim(),
      target_amount: targetAmount,
      deadline: deadline || null,
      image_emoji: emoji || "🎯",
      created_by: auth.user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/child/${childId}/goal`);
  await invalidateAppData();
  return { ok: true, data: { id: data.id } };
}

// ────────────────────────────────────────────────────────────
// 목표 기여 — 부모만 (아이 지갑에서 차감 없이 직접 기여)
// ────────────────────────────────────────────────────────────

export async function contributeToGoalAction(input: {
  goalId: string;
  childId: string;
  amount: number;
  memo?: string;
}): Promise<ActionResult> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  const { goalId, childId, amount, memo } = input;

  if (amount < 100) return { ok: false, error: "최소 기여 금액은 100원이에요." };

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("contribute_to_goal", {
    p_goal_id: goalId,
    p_amount: amount,
    p_contributor_type: "sponsor",
    p_memo: memo || null,
  });

  if (error) return { ok: false, error: error.message };
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) return { ok: false, error: result.error ?? "기여에 실패했어요." };

  revalidatePath(`/child/${childId}/goal`);
  await invalidateAppData();
  return { ok: true };
}

// ────────────────────────────────────────────────────────────
// 아이 직접 저금 — 아이 모드 (child mode) 에서 호출
// 지갑 잔액 차감 + 목표 기여 동시 처리 (child_save_to_goal RPC)
// ────────────────────────────────────────────────────────────

export async function childSaveToGoalAction(input: {
  goalId: string;
  childId: string;
  amount: number;
}): Promise<ActionResult> {
  // 아이 모드 또는 부모 세션 모두 허용
  const [parentAuth, childMode] = await Promise.all([
    requireParentSession().catch(() => null),
    getChildModeContext().catch(() => null),
  ]);
  if (!parentAuth?.user && !childMode?.childId) return { ok: false, error: "세션이 없습니다." };

  const { goalId, childId, amount } = input;
  if (amount < 100) return { ok: false, error: "최소 100원 이상 저금할 수 있어요." };

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("child_save_to_goal", {
    p_goal_id: goalId,
    p_amount: amount,
  });

  if (error) return { ok: false, error: error.message };
  const result = data as { ok: boolean; error?: string };
  if (!result.ok) return { ok: false, error: result.error ?? "저금에 실패했어요." };

  revalidatePath(`/child/${childId}/goal`);
  revalidatePath(`/child/${childId}`);
  await invalidateAppData();
  return { ok: true };
}

// ────────────────────────────────────────────────────────────
// 목표 상태 변경 — 부모만
// ────────────────────────────────────────────────────────────

export async function updateGoalStatusAction(input: {
  goalId: string;
  childId: string;
  status: "active" | "paused" | "cancelled";
}): Promise<ActionResult> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("goals")
    .update({ status: input.status })
    .eq("id", input.goalId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/child/${input.childId}/goal`);
  await invalidateAppData();
  return { ok: true };
}
