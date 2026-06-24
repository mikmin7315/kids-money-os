"use server";

import { revalidatePath } from "next/cache";
import { approveBorrowRequest, computeMonthlyReport, createMoneyTransaction } from "@/lib/finance";
import { requireParentSession, requireChildOrParentAccess } from "@/lib/auth";
import { getAppDataBundle, isDemoMode } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { insertNotification, getParentIdForChild } from "@/lib/notifications";
import { uploadBehaviorPhoto } from "@/lib/supabase/storage";

type ActionResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const MAX_MONEY_AMOUNT = 100_000_000;

export type FormState = {
  ok: boolean;
  message: string;
};

export async function createBehaviorLogAction(input: {
  childId: string;
  behaviorRuleId: string;
  date: string;
  memo?: string;
  photoUrl?: string;
  photoTakenAt?: string;
}): Promise<ActionResult<{ id: string }>> {
  const { isParent, isChild } = await requireChildOrParentAccess(input.childId);
  if (!isParent && !isChild) return { ok: false, error: "권한 없음" };

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-log-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const { data: rule } = await supabase
      .from("behavior_rules")
      .select("id")
      .eq("id", input.behaviorRuleId)
      .eq("parent_id", authData.user?.id ?? "")
      .maybeSingle();
    if (!rule) return { ok: false, error: "행동 규칙을 찾을 수 없습니다." };

    const { data, error } = await supabase
      .from("behavior_logs")
      .insert({
        child_id: input.childId,
        behavior_rule_id: input.behaviorRuleId,
        behavior_date: input.date,
        status: "pending",
        memo: input.memo ?? "",
        photo_url: input.photoUrl ?? null,
        photo_taken_at: input.photoTakenAt ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Notify parent if this rule needs approval
    const parentId = await getParentIdForChild(input.childId);
    if (parentId) {
      await insertNotification({
        parentId,
        childId: input.childId,
        target: "parent",
        type: "behavior_check_requested",
        title: "행동 약속 확인 요청",
        body: `아이가 행동 약속을 기록했습니다. 확인 후 승인해주세요.`,
      });
    }

    revalidatePath("/");
    revalidatePath("/behaviors");
    revalidatePath(`/child/${input.childId}`);
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "오늘은 이미 이 약속을 기록했어요." };
    }
    return { ok: false, error: error instanceof Error ? error.message : "행동 기록 생성 실패." };
  }
}

export async function approveBehaviorLogAction(input: {
  behaviorLogId: string;
  approvedDate: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  const bundle = await getAppDataBundle();
  const log = bundle.behaviorLogs.find((item) => item.id === input.behaviorLogId);

  if (!log) return { ok: false, error: "행동 기록을 찾을 수 없습니다." };

  const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-approved-${log.id}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();

    const { data: approval, error: updateError } = await supabase
      .rpc("approve_behavior_log", {
        p_behavior_log_id: input.behaviorLogId,
        p_approved_date: input.approvedDate,
      })
      .maybeSingle();
    if (updateError) throw updateError;
    if (!approval) return { ok: false, error: "이미 처리된 행동 기록입니다." };

    if (auth.user) {
      await insertNotification({
        parentId: auth.user.id,
        childId: log.childId,
        target: "child",
        type: "behavior_approved",
        title: "행동 약속 승인",
        body: rule ? `'${rule.title}' 약속이 승인됐어요!${rule.rewardAmount > 0 ? ` 보상 ${rule.rewardAmount.toLocaleString()}원이 지급됩니다.` : ""}` : "행동 약속이 승인됐어요!",
      });
    }

    revalidatePath("/");
    revalidatePath("/behaviors");
    revalidatePath("/approvals");
    revalidatePath(`/child/${log.childId}`);
    return { ok: true, data: { id: log.id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "행동 승인 실패." };
  }
}

export async function rejectBehaviorLogAction(input: {
  behaviorLogId: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  const bundle = await getAppDataBundle();
  const log = bundle.behaviorLogs.find((item) => item.id === input.behaviorLogId);

  if (!log) return { ok: false, error: "행동 기록을 찾을 수 없습니다." };

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-rejected-${log.id}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: updatedLog, error } = await supabase
      .from("behavior_logs")
      .update({ status: "rejected" })
      .eq("id", input.behaviorLogId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!updatedLog) return { ok: false, error: "이미 처리된 행동 기록입니다." };

    if (auth.user) {
      await insertNotification({
        parentId: auth.user.id,
        childId: log.childId,
        target: "child",
        type: "behavior_rejected",
        title: "행동 약속 반려",
        body: "이번 행동 약속이 반려됐어요. 다시 도전해봐요!",
      });
    }

    revalidatePath("/behaviors");
    revalidatePath("/approvals");
    revalidatePath("/");
    revalidatePath(`/child/${log.childId}`);
    return { ok: true, data: { id: log.id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "행동 반려 실패." };
  }
}

export async function createMoneyTransactionAction(input: {
  childId: string;
  date: string;
  type: "allowance" | "reward" | "spend" | "save" | "unsave" | "borrow" | "repay" | "interest";
  amount: number;
  memo: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  if (!auth.user) return { ok: false, error: "부모 세션이 없습니다." };
  if (!isValidMoneyAmount(input.amount)) return { ok: false, error: "금액이 올바르지 않습니다." };

  const transaction = createMoneyTransaction(input);

  if (isDemoMode()) {
    return { ok: true, data: { id: transaction.id } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    if (!(await parentOwnsChild(supabase, auth.user.id, input.childId))) {
      return { ok: false, error: "아이를 찾을 수 없습니다." };
    }
    const limitError = await validateTransactionLimits(supabase, input.childId, input.type, input.amount);
    if (limitError) return { ok: false, error: limitError };
    // DB trigger on money_transactions automatically updates wallet_snapshots balance
    const { data, error } = await supabase
      .from("money_transactions")
      .insert({
        child_id: transaction.childId,
        tx_date: transaction.date,
        type: transaction.type,
        amount: transaction.amount,
        savings_delta: transaction.savingsDelta,
        borrowed_delta: transaction.borrowedDelta,
        memo: transaction.memo,
      })
      .select("id")
      .single();

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/records");
    revalidatePath(`/child/${input.childId}`);
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "거래 생성 실패." };
  }
}

export async function createBorrowRequestAction(input: {
  childId: string;
  requestedAmount: number;
  purpose: string;
  repaymentMode: "next_allowance" | "installment";
  installmentCount?: number;
}): Promise<ActionResult<{ id: string }>> {
  const { isParent, isChild } = await requireChildOrParentAccess(input.childId);
  if (!isParent && !isChild) return { ok: false, error: "권한 없음" };
  if (!isValidMoneyAmount(input.requestedAmount)) return { ok: false, error: "금액이 올바르지 않습니다." };
  if (
    input.repaymentMode === "installment" &&
    (!Number.isInteger(input.installmentCount) || (input.installmentCount ?? 0) < 1 || (input.installmentCount ?? 0) > 60)
  ) {
    return { ok: false, error: "상환 횟수가 올바르지 않습니다." };
  }

  // Interest rate computed server-side from child's current policy (not accepted from client)
  const bundle = await getAppDataBundle();
  const policy = bundle.interestPolicies.find((p) => p.childId === input.childId);
  const interestRate = policy?.baseInterestRate ?? 0;

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-borrow-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: conditions, error: conditionsError } = await supabase
      .from("borrow_conditions")
      .select("max_amount, requires_purpose")
      .eq("child_id", input.childId)
      .maybeSingle();
    if (conditionsError) throw conditionsError;
    const maxAmount = Number(conditions?.max_amount ?? 10_000);
    if (input.requestedAmount > maxAmount) {
      return { ok: false, error: `미리쓰기는 최대 ${maxAmount.toLocaleString()}원까지 요청할 수 있어요.` };
    }
    if ((conditions?.requires_purpose ?? true) && !input.purpose.trim()) {
      return { ok: false, error: "미리쓰기 목적을 입력해주세요." };
    }
    const { data, error } = await supabase
      .from("borrow_requests")
      .insert({
        child_id: input.childId,
        requested_amount: input.requestedAmount,
        purpose: input.purpose,
        status: "pending",
        repayment_mode: input.repaymentMode,
        installment_count: input.installmentCount,
        interest_rate: interestRate,
      })
      .select("id")
      .single();

    if (error) throw error;

    const parentId2 = await getParentIdForChild(input.childId);
    if (parentId2) {
      await insertNotification({
        parentId: parentId2,
        childId: input.childId,
        target: "parent",
        type: "borrow_requested",
        title: "미리쓰기 요청 도착",
        body: `아이가 ${input.requestedAmount.toLocaleString()}원 미리쓰기를 요청했습니다. 승인 여부를 확인해주세요.`,
      });
    }

    revalidatePath("/approvals");
    revalidatePath(`/child/${input.childId}`);
    return { ok: true, data: { id: String(data.id) } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "미리쓰기 요청 실패." };
  }
}

export async function approveBorrowRequestAction(input: {
  borrowRequestId: string;
  approvalDate: string;
}): Promise<ActionResult<{ transactionId: string; scheduleCount: number }>> {
  const auth = await requireParentSession();

  const bundle = await getAppDataBundle();
  const request = bundle.borrowRequests.find((item) => item.id === input.borrowRequestId);

  if (!request) return { ok: false, error: "미리쓰기 요청을 찾을 수 없습니다." };

  if (isDemoMode()) {
    const approved = approveBorrowRequest({ request, approvalDate: input.approvalDate });
    return {
      ok: true,
      data: { transactionId: approved.transaction.id, scheduleCount: approved.repaymentSchedule.length },
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    const { data: rawApproval, error: requestError } = await supabase
      .rpc("approve_borrow_request", {
        p_borrow_request_id: input.borrowRequestId,
        p_approval_date: input.approvalDate,
      })
      .maybeSingle();
    if (requestError) throw requestError;
    const approval = rawApproval as { transaction_id?: string; schedule_count?: number } | null;
    if (!approval?.transaction_id) return { ok: false, error: "이미 처리된 미리쓰기 요청입니다." };

    if (auth.user) {
      await insertNotification({
        parentId: auth.user.id,
        childId: request.childId,
        target: "child",
        type: "borrow_approved",
        title: "미리쓰기 승인",
        body: `${request.requestedAmount.toLocaleString()}원 미리쓰기가 승인됐어요! 상환 일정 ${approval.schedule_count ?? 0}건이 생성됐습니다.`,
      });
    }

    revalidatePath("/");
    revalidatePath("/approvals");
    revalidatePath(`/child/${request.childId}`);
    return {
      ok: true,
      data: { transactionId: approval.transaction_id, scheduleCount: approval.schedule_count ?? 0 },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "미리쓰기 승인 실패." };
  }
}

export async function rejectBorrowRequestAction(input: {
  borrowRequestId: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireParentSession();
  const bundle = await getAppDataBundle();
  const request = bundle.borrowRequests.find((item) => item.id === input.borrowRequestId);

  if (!request) return { ok: false, error: "미리쓰기 요청을 찾을 수 없습니다." };

  if (isDemoMode()) {
    return { ok: true, data: { id: `mock-rejected-${request.id}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data: updatedRequest, error } = await supabase
      .from("borrow_requests")
      .update({ status: "rejected" })
      .eq("id", input.borrowRequestId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!updatedRequest) return { ok: false, error: "이미 처리된 미리쓰기 요청입니다." };

    if (auth.user) {
      await insertNotification({
        parentId: auth.user.id,
        childId: request.childId,
        target: "child",
        type: "borrow_rejected",
        title: "미리쓰기 반려",
        body: `${request.requestedAmount.toLocaleString()}원 미리쓰기 요청이 반려됐어요.`,
      });
    }

    revalidatePath("/approvals");
    revalidatePath("/");
    revalidatePath(`/child/${request.childId}`);
    return { ok: true, data: { id: request.id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "미리쓰기 반려 실패." };
  }
}

export async function generateMonthlyReportAction(input: {
  childId: string;
  year: number;
  month: number;
}): Promise<ActionResult<{ childId: string; year: number; month: number }>> {
  await requireParentSession();

  const bundle = await getAppDataBundle();
  const report = computeMonthlyReport(
    input.childId,
    input.year,
    input.month,
    bundle.moneyTransactions,
    bundle.behaviorLogs,
  );

  if (isDemoMode()) {
    return { ok: true, data: { childId: report.childId, year: report.year, month: report.month } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from("monthly_reports").upsert(
      {
        child_id: report.childId,
        year: report.year,
        month: report.month,
        total_allowance: report.totalAllowance,
        total_spend: report.totalSpend,
        total_save: report.totalSave,
        total_interest: report.totalInterest,
        total_borrowed: report.totalBorrowed,
        behavior_success_rate: report.behaviorSuccessRate,
      },
      { onConflict: "child_id,year,month" },
    );

    if (error) throw error;
    revalidatePath("/reports");
    return { ok: true, data: { childId: report.childId, year: report.year, month: report.month } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "리포트 생성 실패." };
  }
}

// ────────────────────────────────────────────────────────────
// Form wrappers (useActionState compatible)
// ────────────────────────────────────────────────────────────

export async function submitBehaviorLogForm(_: FormState, formData: FormData): Promise<FormState> {
  const childId = readString(formData, "childId");
  const behaviorRuleId = readString(formData, "behaviorRuleId");
  const date = readString(formData, "date");
  const memo = readOptionalString(formData, "memo");

  if (!childId || !behaviorRuleId || !date) {
    return { ok: false, message: "필수 항목이 누락되었습니다." };
  }

  const photoFile = formData.get("photoFile") as File | null;
  let photoUrl: string | undefined;
  let photoTakenAt: string | undefined;

  if (photoFile && photoFile.size > 0) {
    const uploadResult = await uploadBehaviorPhoto(photoFile, childId);
    if (uploadResult.ok) {
      photoUrl = uploadResult.url;
      photoTakenAt = readOptionalString(formData, "photoTakenAt") ?? new Date().toISOString();
    }
  }

  const result = await createBehaviorLogAction({ childId, behaviorRuleId, date, memo, photoUrl, photoTakenAt });
  return result.ok
    ? { ok: true, message: "약속을 기록했어요! 부모님이 확인해줄 거예요 🎉" }
    : { ok: false, message: result.error ?? "행동 기록 실패." };
}

export async function submitTransactionForm(_: FormState, formData: FormData): Promise<FormState> {
  const childId = readString(formData, "childId");
  const date = readString(formData, "date");
  const type = readString(formData, "type") as
    | "allowance" | "reward" | "spend" | "save" | "unsave" | "borrow" | "repay" | "interest";
  const amount = Number(readString(formData, "amount"));
  const memo = readString(formData, "memo");

  if (!childId || !date || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "입력값이 올바르지 않습니다." };
  }

  const result = await createMoneyTransactionAction({ childId, date, type, amount, memo: memo || transactionTypeLabel(type) });
  return result.ok
    ? { ok: true, message: `거래 완료: ${result.data?.id}` }
    : { ok: false, message: result.error ?? "거래 실패." };
}

export async function submitBorrowApprovalForm(_: FormState, formData: FormData): Promise<FormState> {
  const borrowRequestId = readString(formData, "borrowRequestId");
  const approvalDate = readString(formData, "approvalDate");

  if (!borrowRequestId || !approvalDate) {
    return { ok: false, message: "필수 항목이 누락되었습니다." };
  }

  const result = await approveBorrowRequestAction({ borrowRequestId, approvalDate });
  return result.ok
    ? { ok: true, message: `미리쓰기 승인 완료. 상환 일정 ${result.data?.scheduleCount}건 생성.` }
    : { ok: false, message: result.error ?? "미리쓰기 승인 실패." };
}

export async function submitBehaviorApprovalForm(_: FormState, formData: FormData): Promise<FormState> {
  const behaviorLogId = readString(formData, "behaviorLogId");
  const approvedDate = readString(formData, "approvedDate");

  if (!behaviorLogId || !approvedDate) {
    return { ok: false, message: "필수 항목이 누락되었습니다." };
  }

  const result = await approveBehaviorLogAction({ behaviorLogId, approvedDate });
  return result.ok
    ? { ok: true, message: `행동 승인 완료: ${result.data?.id}` }
    : { ok: false, message: result.error ?? "행동 승인 실패." };
}

export async function submitBehaviorRejectForm(_: FormState, formData: FormData): Promise<FormState> {
  const behaviorLogId = readString(formData, "behaviorLogId");

  if (!behaviorLogId) {
    return { ok: false, message: "필수 항목이 누락되었습니다." };
  }

  const result = await rejectBehaviorLogAction({ behaviorLogId });
  return result.ok
    ? { ok: true, message: `행동 반려 완료: ${result.data?.id}` }
    : { ok: false, message: result.error ?? "행동 반려 실패." };
}

export async function submitBorrowRequestForm(_: FormState, formData: FormData): Promise<FormState> {
  const childId = readString(formData, "childId");
  const requestedAmount = Number(readString(formData, "requestedAmount"));
  const purpose = readString(formData, "purpose");
  const repaymentMode = readString(formData, "repaymentMode") as "next_allowance" | "installment";
  const installmentCount = Number(readString(formData, "installmentCount"));

  if (!childId || !purpose || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return { ok: false, message: "입력값이 올바르지 않습니다." };
  }

  const result = await createBorrowRequestAction({
    childId,
    requestedAmount,
    purpose,
    repaymentMode,
    installmentCount: repaymentMode === "installment" && Number.isFinite(installmentCount) ? installmentCount : undefined,
  });

  return result.ok
    ? { ok: true, message: `미리쓰기 요청 완료: ${result.data?.id}` }
    : { ok: false, message: result.error ?? "미리쓰기 요청 실패." };
}

export async function submitBorrowRejectForm(_: FormState, formData: FormData): Promise<FormState> {
  const borrowRequestId = readString(formData, "borrowRequestId");

  if (!borrowRequestId) {
    return { ok: false, message: "필수 항목이 누락되었습니다." };
  }

  const result = await rejectBorrowRequestAction({ borrowRequestId });
  return result.ok
    ? { ok: true, message: `미리쓰기 반려 완료: ${result.data?.id}` }
    : { ok: false, message: result.error ?? "미리쓰기 반려 실패." };
}

export async function submitMonthlyReportForm(_: FormState, formData: FormData): Promise<FormState> {
  const childId = readString(formData, "childId");
  const year = Number(readString(formData, "year"));
  const month = Number(readString(formData, "month"));

  if (!childId || !Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return { ok: false, message: "입력값이 올바르지 않습니다." };
  }

  const result = await generateMonthlyReportAction({ childId, year, month });
  return result.ok
    ? { ok: true, message: `리포트 생성 완료: ${result.data?.year}-${result.data?.month}` }
    : { ok: false, message: result.error ?? "리포트 생성 실패." };
}

// ── P-14: 일회성 용돈 지급 폼 액션 ──
export async function giveAllowanceForm(
  _prev: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const childId = readString(formData, "childId");
  const amount = Math.floor(Number(formData.get("amount")));
  const memo = readString(formData, "memo") || "용돈 지급";

  if (!childId) return { ok: false, message: "아이 정보가 없습니다." };
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, message: "금액을 올바르게 입력해주세요." };
  if (amount > MAX_MONEY_AMOUNT) return { ok: false, message: "최대 1억원까지 지급할 수 있어요." };

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const result = await createMoneyTransactionAction({ childId, date: today, type: "allowance", amount, memo });
  if (!result.ok) return { ok: false, message: result.error ?? "지급에 실패했어요." };
  return { ok: true, message: `${amount.toLocaleString()}원을 줬어요! 🎉` };
}

export async function cashSpendAction(
  _prev: { ok: boolean; message: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const childId = readString(formData, "childId");
  const amount = Math.floor(Number(formData.get("amount")));
  const date = readString(formData, "date") || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const memo = readString(formData, "memo") || "현금 사용";

  if (!childId) return { ok: false, message: "아이 정보가 없습니다." };
  if (!Number.isInteger(amount) || amount <= 0) return { ok: false, message: "금액을 올바르게 입력해주세요." };
  if (amount > MAX_MONEY_AMOUNT) return { ok: false, message: "최대 1억원까지 입력할 수 있어요." };

  const result = await createMoneyTransactionAction({ childId, date, type: "spend", amount, memo });
  if (!result.ok) return { ok: false, message: result.error ?? "기록에 실패했어요." };
  return { ok: true, message: `${amount.toLocaleString()}원 현금 사용을 기록했어요.` };
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : undefined;
}

function isValidMoneyAmount(amount: number) {
  return Number.isInteger(amount) && amount > 0 && amount <= MAX_MONEY_AMOUNT;
}

function transactionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    allowance: "용돈",
    reward: "보상",
    spend: "사용",
    save: "저금",
    unsave: "저금 해제",
    borrow: "미리쓰기",
    repay: "상환",
    interest: "이자",
  };
  return labels[type] ?? "금융 기록";
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
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

async function validateTransactionLimits(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  childId: string,
  type: "allowance" | "reward" | "spend" | "save" | "unsave" | "borrow" | "repay" | "interest",
  amount: number,
) {
  if (!["spend", "save", "unsave", "repay"].includes(type)) return null;
  const { data: wallet, error } = await supabase
    .from("wallet_snapshots")
    .select("balance, savings_balance, borrowed_balance")
    .eq("child_id", childId)
    .maybeSingle();
  if (error) throw error;
  const balance = Number(wallet?.balance ?? 0);
  const savings = Number(wallet?.savings_balance ?? 0);
  const borrowed = Number(wallet?.borrowed_balance ?? 0);
  if (type === "repay" && amount > borrowed) return "갚아야 할 금액보다 많이 갚을 수 없습니다.";
  if (["spend", "save", "repay"].includes(type) && amount > balance) return "사용 가능한 금액이 부족합니다.";
  if (type === "unsave" && amount > savings) return "저금한 금액이 부족합니다.";
  return null;
}
