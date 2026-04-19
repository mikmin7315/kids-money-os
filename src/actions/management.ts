"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { requireParentSession } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/data";
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

  if (!hasSupabaseEnv()) {
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
  await requireParentSession();

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { childId: input.childId } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const hashedPin = await hashPin(input.pin);
    const { error } = await supabase
      .from("children")
      .update({ pin_code: hashedPin })
      .eq("id", input.childId);

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
  if (!hasSupabaseEnv()) {
    // Demo mode: any PIN works
    const cookieStore = await cookies();
    cookieStore.set("child_mode", input.childId, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "lax",
    });
    return { ok: true, data: { childId: input.childId } };
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data: child, error } = await admin
      .from("children")
      .select("id, pin_code")
      .eq("id", input.childId)
      .maybeSingle();

    if (error) throw error;
    if (!child) return { ok: false, error: "아이를 찾을 수 없습니다." };

    if (!child.pin_code) {
      return { ok: false, error: "PIN이 설정되지 않았습니다. 부모님께 PIN 설정을 요청하세요." };
    }
    const valid = await verifyPin(input.pin, child.pin_code);
    if (!valid) return { ok: false, error: "PIN이 올바르지 않습니다." };

    const cookieStore = await cookies();
    cookieStore.set("child_mode", input.childId, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: "/",
      sameSite: "lax",
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
  requiresParentApproval: boolean;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };

  if (!hasSupabaseEnv()) {
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
        requires_parent_approval: input.requiresParentApproval,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) throw error;
    revalidatePath("/behaviors");
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

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { id: `mock-policy-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
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

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { id: `mock-allowance-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
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

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { id: `mock-borrow-conditions-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
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
    revalidatePath("/settings");
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "미리쓰기 조건 저장 실패." };
  }
}

// ────────────────────────────────────────────────────────────
// Seeding
// ────────────────────────────────────────────────────────────

export async function seedSampleChildrenIfEmpty() {
  if (!hasSupabaseEnv()) return;

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
  const requiresParentApproval = formData.get("requiresParentApproval") === "on";

  if (!title || !Number.isFinite(rewardAmount) || !Number.isFinite(interestDelta)) {
    return { ok: false, message: "규칙 제목과 보상을 입력해주세요." };
  }

  const result = await createBehaviorRuleAction({
    title,
    description,
    rewardAmount,
    interestDelta,
    requiresParentApproval,
  });

  return result.ok
    ? { ok: true, message: `약속 규칙 생성 완료: ${result.data?.id}` }
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

  if (!childId || !pin) {
    return { ok: false, message: "PIN을 입력해주세요." };
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
