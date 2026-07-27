"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { requireParentSession } from "@/lib/auth";
import { isDemoMode, invalidateAppData } from "@/lib/data";
import { isValidInterestRateRange } from "@/lib/interest-policy";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

const scryptAsync = promisify(scrypt);

async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(pin, salt, 64) as Buffer).toString("hex");
  return `${salt}:${hash}`;
}

async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const inputHash = (await scryptAsync(pin, salt, 64) as Buffer).toString("hex");
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(inputHash, "hex"));
  } catch {
    return false;
  }
}

export type ManagementFormState = {
  ok: boolean;
  message: string;
};

type ActionResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

// ────────────────────────────────────────────────────────────
// Child management
// ────────────────────────────────────────────────────────────

export async function createChildAction(input: {
  name: string;
  nickname: string;
  birthYear: number;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-child-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("children")
      .insert({
        parent_id: auth.user.id,
        name: input.name,
        nickname: input.nickname || input.name,
        birth_year: input.birthYear,
      })
      .select("id")
      .single();

    if (error) throw error;

    void invalidateAppData();
    revalidatePath("/");
    revalidatePath("/child-mode");
    revalidatePath("/settings");
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "아이 생성 실패." };
  }
}

// ────────────────────────────────────────────────────────────
// Child PIN
// ────────────────────────────────────────────────────────────

export async function setChildPinAction(input: {
  childId: string;
  pin: string;
}): Promise<ActionResult<{ childId: string }>> {
  const auth = await requireParentSession();

  if (isDemoMode()) {
    return { ok: true, data: { childId: input.childId } };
  }
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  try {
    const supabase = await getSupabaseServerClient();
    if (!(await parentOwnsChild(supabase, auth.user.id, input.childId))) {
      return { ok: false, error: "아이를 찾을 수 없습니다." };
    }
    const hashedPin = await hashPin(input.pin);
    const { error } = await supabase
      .from("children")
      .update({ pin_code: hashedPin })
      .eq("id", input.childId)
      .eq("parent_id", auth.user.id);

    if (error) throw error;
    return { ok: true, data: { childId: input.childId } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "PIN 설정 실패." };
  }
}

export async function validateChildPinAction(input: {
  childId: string;
  pin: string;
}): Promise<ActionResult<{ childId: string }>> {
  if (isDemoMode()) {
    // Demo mode: any PIN works
    const cookieStore = await cookies();
    cookieStore.set("child_mode", input.childId, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return { ok: true, data: { childId: input.childId } };
  }

  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "인증이 필요합니다." };

  try {
    const admin = getSupabaseAdminClient();
    const { data: child, error } = await admin
      .from("children")
      .select("id, parent_id, pin_code, pin_failed_attempts, pin_locked_until")
      .eq("id", input.childId)
      .maybeSingle();

    if (error) throw error;
    if (!child) return { ok: false, error: "아이를 찾을 수 없습니다." };
    if (auth.profile?.role !== "admin" && child.parent_id !== auth.user.id) {
      return { ok: false, error: "아이를 찾을 수 없습니다." };
    }

    if (!child.pin_code) {
      return { ok: false, error: "PIN이 설정되지 않았습니다. 부모님께 PIN 설정을 요청하세요." };
    }
    const { data: rawAttempt, error: attemptError } = await admin
      .rpc("consume_child_pin_attempt", { p_child_id: input.childId })
      .single();
    if (attemptError) throw attemptError;
    const attempt = rawAttempt as { attempt_allowed?: boolean; locked_until?: string | null } | null;
    if (!attempt?.attempt_allowed) {
      return { ok: false, error: "PIN 입력이 잠시 잠겼습니다. 15분 후 다시 시도해주세요." };
    }

    const valid = await verifyPin(input.pin, child.pin_code);
    if (!valid) {
      return { ok: false, error: "PIN이 올바르지 않습니다." };
    }

    const { error: resetError } = await admin
      .from("children")
      .update({ pin_failed_attempts: 0, pin_locked_until: null })
      .eq("id", input.childId);
    if (resetError) throw resetError;

    const cookieStore = await cookies();
    cookieStore.set("child_mode", input.childId, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return { ok: true, data: { childId: input.childId } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "PIN 확인 실패." };
  }
}

// ────────────────────────────────────────────────────────────
// Behavior rules
// ────────────────────────────────────────────────────────────

export async function createBehaviorRuleAction(input: {
  title: string;
  description: string;
  rewardAmount: number;
  interestDelta: number;
  ruleCategory: "recurring" | "monthly_goal";
  monthlyTargetRate: number;
  requiresParentApproval: boolean;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-rule-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("behavior_rules")
      .insert({
        parent_id: auth.user.id,
        title: input.title,
        description: input.description,
        reward_amount: input.rewardAmount,
        interest_delta: input.interestDelta,
        rule_category: input.ruleCategory,
        monthly_target_rate: input.monthlyTargetRate,
        requires_parent_approval: input.requiresParentApproval,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) throw error;
    revalidatePath("/behaviors");
    void invalidateAppData();
    revalidatePath("/");
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "약속 규칙 생성 실패." };
  }
}

// ────────────────────────────────────────────────────────────
// Interest policy (P-I-01)
// ────────────────────────────────────────────────────────────

export async function upsertInterestPolicyAction(input: {
  childId: string;
  baseInterestRate: number;
  minInterestRate: number;
  maxInterestRate: number;
  settlementCycle: "weekly" | "monthly";
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (!isValidInterestRateRange(input)) {
    return { ok: false, error: "이자율은 최소 ≤ 기본 ≤ 최대 순서로 설정해 주세요." };
  }

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-policy-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    if (!(await parentOwnsChild(supabase, auth.user.id, input.childId))) {
      return { ok: false, error: "아이를 찾을 수 없습니다." };
    }
    const { data, error } = await supabase
      .from("interest_policies")
      .upsert(
        {
          parent_id: auth.user.id,
          child_id: input.childId,
          base_interest_rate: input.baseInterestRate,
          min_interest_rate: input.minInterestRate,
          max_interest_rate: input.maxInterestRate,
          settlement_cycle: input.settlementCycle,
        },
        { onConflict: "child_id" },
      )
      .select("id")
      .single();

    if (error) throw error;
    revalidatePath("/settings");
    void invalidateAppData();
    revalidatePath("/");
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "이자 정책 저장 실패." };
  }
}

// ────────────────────────────────────────────────────────────
// Allowance rules (P-13)
// ────────────────────────────────────────────────────────────

export async function createAllowanceRuleAction(input: {
  childId: string;
  title: string;
  amount: number;
  type: "weekly" | "monthly" | "manual";
  weekday?: number;
  dayOfMonth?: number;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-allowance-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    if (!(await parentOwnsChild(supabase, auth.user.id, input.childId))) {
      return { ok: false, error: "아이를 찾을 수 없습니다." };
    }
    const { data, error } = await supabase
      .from("allowance_rules")
      .insert({
        parent_id: auth.user.id,
        child_id: input.childId,
        title: input.title,
        amount: input.amount,
        type: input.type,
        weekday: input.weekday,
        day_of_month: input.dayOfMonth,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) throw error;
    void invalidateAppData();
    revalidatePath("/settings");
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "용돈 규칙 생성 실패." };
  }
}

// ────────────────────────────────────────────────────────────
// Borrow conditions (P-L-01)
// ────────────────────────────────────────────────────────────

export async function upsertBorrowConditionsAction(input: {
  childId: string;
  maxAmount: number;
  requiresPurpose: boolean;
  autoApproveBlow: number;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-borrow-conditions-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    if (!(await parentOwnsChild(supabase, auth.user.id, input.childId))) {
      return { ok: false, error: "아이를 찾을 수 없습니다." };
    }
    const { data, error } = await supabase
      .from("borrow_conditions")
      .upsert(
        {
          parent_id: auth.user.id,
          child_id: input.childId,
          max_amount: input.maxAmount,
          requires_purpose: input.requiresPurpose,
          auto_approve_below: input.autoApproveBlow,
        },
        { onConflict: "child_id" },
      )
      .select("id")
      .single();

    if (error) throw error;
    void invalidateAppData();
    revalidatePath("/settings");
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "미리쓰기 조건 저장 실패." };
  }
}

// ────────────────────────────────────────────────────────────
// Delete / toggle actions
// ────────────────────────────────────────────────────────────

export async function deleteAllowanceRuleAction(
  _prev: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, message: "부모 세션이 없습니다." };
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!ruleId) return { ok: false, message: "규칙 ID가 없습니다." };

  if (isDemoMode()) {
    revalidatePath("/settings");
    revalidatePath("/settings/allowance");
    return { ok: true, message: "삭제되었어요." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("allowance_rules")
    .delete()
    .eq("id", ruleId)
    .eq("parent_id", auth.user.id);

  if (error) return { ok: false, message: "삭제 중 오류가 발생했어요." };
  void invalidateAppData();
  revalidatePath("/settings");
  revalidatePath("/settings/allowance");
  return { ok: true, message: "용돈 규칙이 삭제되었어요." };
}

export async function deleteInterestPolicyAction(
  _prev: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, message: "부모 세션이 없습니다." };
  const policyId = String(formData.get("policyId") ?? "");
  if (!policyId) return { ok: false, message: "정책 ID가 없습니다." };

  if (isDemoMode()) {
    revalidatePath("/settings");
    return { ok: true, message: "삭제되었어요." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("interest_policies")
    .delete()
    .eq("id", policyId)
    .eq("parent_id", auth.user.id);

  if (error) return { ok: false, message: "삭제 중 오류가 발생했어요." };
  void invalidateAppData();
  revalidatePath("/settings");
  revalidatePath("/settings/interest");
  return { ok: true, message: "이자 정책이 삭제되었어요." };
}

export async function updateBehaviorRuleAction(input: {
  ruleId: string;
  title: string;
  description: string;
  rewardAmount: number;
  interestDelta: number;
  requiresParentApproval: boolean;
  monthlyTargetRate: number;
}): Promise<ActionResult<void>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (isDemoMode()) {
    revalidatePath("/behaviors");
    return { ok: true };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("behavior_rules")
    .update({
      title: input.title,
      description: input.description,
      reward_amount: input.rewardAmount,
      interest_delta: input.interestDelta,
      requires_parent_approval: input.requiresParentApproval,
      monthly_target_rate: input.monthlyTargetRate,
    })
    .eq("id", input.ruleId)
    .eq("parent_id", auth.user.id);

  if (error) return { ok: false, error: error.message };
  void invalidateAppData();
  revalidatePath("/behaviors");
  revalidatePath("/");
  return { ok: true };
}

export async function updateBehaviorRuleForm(
  _prev: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const ruleId = String(formData.get("ruleId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rewardAmount = Number(formData.get("rewardAmount") ?? 0);
  const interestDelta = Number(formData.get("interestDelta") ?? 0);
  const requiresParentApproval = formData.get("requiresParentApproval") === "on";
  const monthlyTargetRate = Number(formData.get("monthlyTargetRate") ?? 80);

  if (!ruleId || !title) return { ok: false, message: "필수 항목을 입력해주세요." };

  const result = await updateBehaviorRuleAction({
    ruleId, title, description, rewardAmount, interestDelta, requiresParentApproval, monthlyTargetRate,
  });
  if (!result.ok) return { ok: false, message: result.error ?? "수정 중 오류가 발생했어요." };
  return { ok: true, message: "약속이 수정되었어요." };
}

export async function toggleBehaviorRuleAction(
  _prev: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, message: "부모 세션이 없습니다." };
  const ruleId = String(formData.get("ruleId") ?? "");
  const isActive = formData.get("isActive") === "true";
  if (!ruleId) return { ok: false, message: "규칙 ID가 없습니다." };

  if (isDemoMode()) {
    revalidatePath("/behaviors");
    return { ok: true, message: isActive ? "비활성화되었어요." : "활성화되었어요." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("behavior_rules")
    .update({ is_active: !isActive })
    .eq("id", ruleId)
    .eq("parent_id", auth.user.id);

  if (error) return { ok: false, message: "변경 중 오류가 발생했어요." };
  void invalidateAppData();
  revalidatePath("/behaviors");
  revalidatePath("/manage");
  revalidatePath("/");
  return { ok: true, message: !isActive ? "활성화되었어요." : "비활성화되었어요." };
}

export async function deleteBehaviorRuleAction(
  _prev: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, message: "부모 세션이 없습니다." };
  const ruleId = String(formData.get("ruleId") ?? "");
  if (!ruleId) return { ok: false, message: "규칙 ID가 없습니다." };

  if (isDemoMode()) {
    revalidatePath("/behaviors");
    return { ok: true, message: "삭제되었어요." };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("behavior_rules")
    .delete()
    .eq("id", ruleId)
    .eq("parent_id", auth.user.id);

  if (error) return { ok: false, message: "삭제 중 오류가 발생했어요." };
  void invalidateAppData();
  revalidatePath("/behaviors");
  revalidatePath("/manage");
  revalidatePath("/");
  return { ok: true, message: "행동 약속이 삭제되었어요." };
}

// ────────────────────────────────────────────────────────────
// Seeding
// ────────────────────────────────────────────────────────────

export async function seedSampleChildrenIfEmpty() {
  if (isDemoMode()) return;

  const auth = await requireParentSession();
  if (!auth.user) return;

  const admin = getSupabaseAdminClient();
  const { data: existingChildren } = await admin
    .from("children")
    .select("id")
    .eq("parent_id", auth.user.id)
    .limit(1);

  if (existingChildren && existingChildren.length > 0) return;

  await admin.from("children").insert([
    { parent_id: auth.user.id, name: "첫째", nickname: "아이A", birth_year: 2017 },
    { parent_id: auth.user.id, name: "둘째", nickname: "아이B", birth_year: 2015 },
  ]);

  revalidatePath("/");
  revalidatePath("/child-mode");
  revalidatePath("/settings");
}

// ────────────────────────────────────────────────────────────
// Form wrappers
// ────────────────────────────────────────────────────────────

export async function createChildForm(_: ManagementFormState, formData: FormData): Promise<ManagementFormState> {
  const name = readString(formData, "name");
  const nickname = readString(formData, "nickname");
  const birthYear = Number(readString(formData, "birthYear"));

  if (!name || !Number.isInteger(birthYear)) {
    return { ok: false, message: "이름과 출생연도를 입력해주세요." };
  }

  const result = await createChildAction({ name, nickname, birthYear });
  return result.ok
    ? { ok: true, message: `${name} 프로필이 추가됐어요! 🎉` }
    : { ok: false, message: result.error ?? "아이 추가에 실패했어요." };
}

export async function createBehaviorRuleForm(
  _: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const title = readString(formData, "title");
  const description = readString(formData, "description");
  const rewardAmount = Number(readString(formData, "rewardAmount"));
  const interestDelta = Number(readString(formData, "interestDelta"));
  const ruleCategory = readString(formData, "ruleCategory") as "recurring" | "monthly_goal";
  const monthlyTargetRate = Math.min(100, Math.max(1, Number(readString(formData, "monthlyTargetRate") || "80")));
  const requiresParentApproval = formData.get("requiresParentApproval") === "on";

  if (!title || !Number.isFinite(rewardAmount) || !Number.isFinite(interestDelta)) {
    return { ok: false, message: "규칙 제목과 보상을 입력해주세요." };
  }

  const result = await createBehaviorRuleAction({
    title,
    description,
    rewardAmount,
    interestDelta,
    ruleCategory: ruleCategory === "monthly_goal" ? "monthly_goal" : "recurring",
    monthlyTargetRate,
    requiresParentApproval,
  });

  return result.ok
    ? { ok: true, message: "약속이 추가됐어요! ✅" }
    : { ok: false, message: result.error ?? "규칙 생성 실패." };
}

export async function upsertInterestPolicyForm(
  _: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const childId = readString(formData, "childId");
  const baseInterestRate = Number(readString(formData, "baseInterestRate"));
  const minInterestRate = Number(readString(formData, "minInterestRate"));
  const maxInterestRate = Number(readString(formData, "maxInterestRate"));
  const settlementCycle = readString(formData, "settlementCycle") as "weekly" | "monthly";

  if (!childId || !Number.isFinite(baseInterestRate)) {
    return { ok: false, message: "아이와 기본 이자율을 입력해주세요." };
  }

  const result = await upsertInterestPolicyAction({
    childId,
    baseInterestRate,
    minInterestRate,
    maxInterestRate,
    settlementCycle,
  });

  return result.ok
    ? { ok: true, message: "이자 정책이 저장되었습니다." }
    : { ok: false, message: result.error ?? "저장 실패." };
}

export async function createAllowanceRuleForm(
  _: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const childId = readString(formData, "childId");
  const title = readString(formData, "title");
  const amount = Number(readString(formData, "amount"));
  const type = readString(formData, "type") as "weekly" | "monthly" | "manual";
  const weekday = Number(readString(formData, "weekday"));
  const dayOfMonth = Number(readString(formData, "dayOfMonth"));

  if (!childId || !title || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "아이, 이름, 금액을 입력해주세요." };
  }

  const result = await createAllowanceRuleAction({
    childId,
    title,
    amount,
    type,
    weekday: type === "weekly" ? weekday : undefined,
    dayOfMonth: type === "monthly" ? dayOfMonth : undefined,
  });

  return result.ok
    ? { ok: true, message: "용돈 규칙이 저장되었습니다." }
    : { ok: false, message: result.error ?? "저장 실패." };
}

export async function upsertBorrowConditionsForm(
  _: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const childId = readString(formData, "childId");
  const maxAmount = Number(readString(formData, "maxAmount"));
  const requiresPurpose = formData.get("requiresPurpose") === "on";
  const autoApproveBlow = Number(readString(formData, "autoApproveBlow"));

  if (!childId || !Number.isFinite(maxAmount) || maxAmount <= 0) {
    return { ok: false, message: "아이와 최대 한도를 입력해주세요." };
  }

  const result = await upsertBorrowConditionsAction({
    childId,
    maxAmount,
    requiresPurpose,
    autoApproveBlow: Number.isFinite(autoApproveBlow) ? autoApproveBlow : 0,
  });

  return result.ok
    ? { ok: true, message: "미리쓰기 조건이 저장되었습니다." }
    : { ok: false, message: result.error ?? "저장 실패." };
}

export async function clearChildPinAction(input: {
  childId: string;
}): Promise<ActionResult<void>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "인증이 필요합니다." };

  try {
    const admin = getSupabaseAdminClient();
    const { data: child, error: fetchError } = await admin
      .from("children")
      .select("id, parent_id")
      .eq("id", input.childId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!child || (auth.profile?.role !== "admin" && child.parent_id !== auth.user.id)) {
      return { ok: false, error: "아이를 찾을 수 없습니다." };
    }

    const { error } = await admin
      .from("children")
      .update({ pin_code: null, pin_failed_attempts: 0, pin_locked_until: null })
      .eq("id", input.childId);
    if (error) throw error;

    await invalidateAppData();
    revalidatePath("/settings");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "PIN 초기화 실패." };
  }
}

export async function clearChildPinForm(
  _: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const childId = readString(formData, "childId");
  if (!childId) return { ok: false, message: "아이 정보가 없습니다." };
  const result = await clearChildPinAction({ childId });
  return result.ok
    ? { ok: true, message: "PIN이 초기화되었습니다." }
    : { ok: false, message: result.error ?? "초기화 실패." };
}

export async function enterChildModeDirectAction(input: {
  childId: string;
}): Promise<ActionResult<{ childId: string }>> {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    cookieStore.set("child_mode", input.childId, {
      httpOnly: true, maxAge: 60 * 60 * 8, path: "/", sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return { ok: true, data: { childId: input.childId } };
  }

  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "인증이 필요합니다." };

  try {
    const admin = getSupabaseAdminClient();
    const { data: child, error } = await admin
      .from("children")
      .select("id, parent_id, pin_code")
      .eq("id", input.childId)
      .maybeSingle();
    if (error) throw error;
    if (!child || (auth.profile?.role !== "admin" && child.parent_id !== auth.user.id)) {
      return { ok: false, error: "아이를 찾을 수 없습니다." };
    }
    if (child.pin_code) {
      return { ok: false, error: "PIN이 설정되어 있습니다. PIN을 입력해주세요." };
    }

    const cookieStore = await cookies();
    cookieStore.set("child_mode", input.childId, {
      httpOnly: true, maxAge: 60 * 60 * 8, path: "/", sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return { ok: true, data: { childId: input.childId } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "입장 실패." };
  }
}

export async function enterChildModeDirectForm(
  _: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const childId = readString(formData, "childId");
  if (!childId) return { ok: false, message: "아이 정보가 없습니다." };
  const result = await enterChildModeDirectAction({ childId });
  return result.ok
    ? { ok: true, message: "입장합니다." }
    : { ok: false, message: result.error ?? "입장 실패." };
}

export async function setChildPinForm(
  _: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const childId = readString(formData, "childId");
  const pin = readString(formData, "pin");

  if (!childId || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return { ok: false, message: "4자리 숫자 PIN을 입력해주세요." };
  }

  const result = await setChildPinAction({ childId, pin });
  return result.ok
    ? { ok: true, message: "PIN이 설정되었습니다." }
    : { ok: false, message: result.error ?? "PIN 설정 실패." };
}

export async function validateChildPinForm(
  _: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const childId = readString(formData, "childId");
  const pin = readString(formData, "pin");

  if (!childId || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return { ok: false, message: "4자리 숫자 PIN을 입력해주세요." };
  }

  const result = await validateChildPinAction({ childId, pin });
  return result.ok
    ? { ok: true, message: "PIN 확인 완료." }
    : { ok: false, message: result.error ?? "PIN 확인 실패." };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function parentOwnsChild(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  parentId: string,
  childId: string,
) {
  const { data, error } = await supabase
    .from("children")
    .select("id")
    .eq("id", childId)
    .eq("parent_id", parentId)
    .maybeSingle();
  if (error) throw error;
  return data != null;
}

// ────────────────────────────────────────────────────────────
// 아이 수정 / 삭제
// ────────────────────────────────────────────────────────────

export async function updateChildAction(input: {
  childId: string;
  name: string;
  nickname: string;
  birthYear: number;
}): Promise<ActionResult<void>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (isDemoMode()) return { ok: true };

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.rpc("update_child", {
      p_child_id: input.childId,
      p_name: input.name,
      p_nickname: input.nickname || input.name,
      p_birth_year: input.birthYear,
    });
    if (error) throw error;
    revalidatePath("/settings");
    void invalidateAppData();
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "아이 정보 수정 실패" };
  }
}

// ────────────────────────────────────────────────────────────
// 지역 설정
// ────────────────────────────────────────────────────────────

export async function updateRegionAction(region: string | null): Promise<ActionResult<void>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (isDemoMode()) return { ok: true };

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ region })
      .eq("id", auth.user.id);
    if (error) throw error;
    revalidatePath("/settings");
    revalidatePath("/settings/region");
    revalidatePath("/reports");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "지역 저장 실패" };
  }
}

export async function deleteChildAction(childId: string): Promise<ActionResult<void>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (isDemoMode()) return { ok: true };

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.rpc("delete_child", { p_child_id: childId });
    if (error) throw error;
    revalidatePath("/settings");
    void invalidateAppData();
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "아이 삭제 실패" };
  }
}

export async function updateChildForm(
  _prev: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const childId = readString(formData, "childId");
  const name = readString(formData, "name");
  const nickname = readString(formData, "nickname");
  const birthYear = Number(readString(formData, "birthYear"));

  if (!childId || !name || !Number.isFinite(birthYear)) {
    return { ok: false, message: "필수 항목을 입력해주세요." };
  }

  const result = await updateChildAction({ childId, name, nickname, birthYear });
  return result.ok ? { ok: true, message: "아이 정보를 수정했어요." } : { ok: false, message: result.error ?? "수정 실패" };
}

export async function deleteChildForm(
  _prev: ManagementFormState,
  formData: FormData,
): Promise<ManagementFormState> {
  const childId = readString(formData, "childId");
  if (!childId) return { ok: false, message: "아이 ID가 없습니다." };

  const result = await deleteChildAction(childId);
  return result.ok ? { ok: true, message: "아이를 삭제했어요." } : { ok: false, message: result.error ?? "삭제 실패" };
}
