"use server";

import { revalidatePath } from "next/cache";
import { approveBorrowRequest, computeMonthlyReport, createMoneyTransaction } from "@/lib/finance";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle, hasSupabaseEnv } from "@/lib/data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { insertNotification, getParentIdForChild } from "@/lib/notifications";

type ActionResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type FormState = {
  ok: boolean;
  message: string;
};

export async function createBehaviorLogAction(input: {
  childId: string;
  behaviorRuleId: string;
  date: string;
  memo?: string;
}): Promise<ActionResult<{ id: string }>> {
  if (!hasSupabaseEnv()) {
    return { ok: true, data: { id: `mock-log-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("behavior_logs")
      .insert({
        child_id: input.childId,
        behavior_rule_id: input.behaviorRuleId,
        behavior_date: input.date,
        status: "pending",
        memo: input.memo ?? "",
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
    return { ok: false, error: error instanceof Error ? error.message : "행동 기록 생성 실패." };
  }
}

export async function approveBehaviorLogAction(input: {
  behaviorLogId: string;
  approvedDate: string;
}): Promise<ActionResult<{ id: string }>> {
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const log = bundle.behaviorLogs.find((item) => item.id === input.behaviorLogId);

  if (!log) return { ok: false, error: "행동 기록을 찾을 수 없습니다." };

  const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
  const policy = bundle.interestPolicies.find((item) => item.childId === log.childId);
  const nextRate = Math.max(
    policy?.minInterestRate ?? 0,
    Math.min((policy?.baseInterestRate ?? 0) + (rule?.interestDelta ?? 0), policy?.maxInterestRate ?? 100),
  );

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { id: `mock-approved-${log.id}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();

    const { error: updateError } = await supabase
      .from("behavior_logs")
      .update({ status: "approved" })
      .eq("id", input.behaviorLogId);
    if (updateError) throw updateError;

    if (rule && rule.rewardAmount > 0) {
      const rewardTx = createMoneyTransaction({
        childId: log.childId,
        date: input.approvedDate,
        type: "reward",
        amount: rule.rewardAmount,
        memo: `${rule.title} 보상 승인`,
      });

      const { error: txError } = await supabase.from("money_transactions").insert({
        child_id: rewardTx.childId,
        tx_date: rewardTx.date,
        type: rewardTx.type,
        amount: rewardTx.amount,
        savings_delta: rewardTx.savingsDelta,
        borrowed_delta: rewardTx.borrowedDelta,
        related_behavior_log_id: log.id,
        memo: rewardTx.memo,
      });
      if (txError) throw txError;
    }

    if (rule && rule.interestDelta !== 0 && policy) {
      // DB trigger on interest_rate_events automatically updates wallet_snapshots.current_interest_rate
      const { error: rateError } = await supabase.from("interest_rate_events").insert({
        child_id: log.childId,
        behavior_rule_id: rule.id,
        rate_delta: rule.interestDelta,
        applied_rate: nextRate,
        reason: `${rule.title} 승인`,
        effective_date: input.approvedDate,
      });
      if (rateError) throw rateError;
    }

    const auth2 = await requireParentSession();
    if (auth2.user) {
      await insertNotification({
        parentId: auth2.user.id,
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
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const log = bundle.behaviorLogs.find((item) => item.id === input.behaviorLogId);

  if (!log) return { ok: false, error: "행동 기록을 찾을 수 없습니다." };

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { id: `mock-rejected-${log.id}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("behavior_logs")
      .update({ status: "rejected" })
      .eq("id", input.behaviorLogId);
    if (error) throw error;

    const auth3 = await requireParentSession();
    if (auth3.user) {
      await insertNotification({
        parentId: auth3.user.id,
        childId: log.childId,
        target: "child",
        type: "behavior_rejected",
        title: "행동 약속 반려",
        body: "이번 행동 약속이 반려됐어요. 다시 도전해봐요!",
      });
    }

    revalidatePath("/behaviors");
    revalidatePath("/approvals");
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
  await requireParentSession();

  const transaction = createMoneyTransaction(input);

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { id: transaction.id } };
  }

  try {
    const supabase = await getSupabaseServerClient();
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
  // Interest rate computed server-side from child's current policy (not accepted from client)
  const bundle = await getAppDataBundle();
  const policy = bundle.interestPolicies.find((p) => p.childId === input.childId);
  const interestRate = policy?.baseInterestRate ?? 0;

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { id: `mock-borrow-${Date.now()}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
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
  await requireParentSession();

  const bundle = await getAppDataBundle();
  const request = bundle.borrowRequests.find((item) => item.id === input.borrowRequestId);

  if (!request) return { ok: false, error: "미리쓰기 요청을 찾을 수 없습니다." };

  const approved = approveBorrowRequest({ request, approvalDate: input.approvalDate });

  if (!hasSupabaseEnv()) {
    return {
      ok: true,
      data: { transactionId: approved.transaction.id, scheduleCount: approved.repaymentSchedule.length },
    };
  }

  try {
    const supabase = await getSupabaseServerClient();

    const { error: requestError } = await supabase
      .from("borrow_requests")
      .update({ status: "approved" })
      .eq("id", input.borrowRequestId);
    if (requestError) throw requestError;

    const { data: txData, error: txError } = await supabase
      .from("money_transactions")
      .insert({
        child_id: approved.transaction.childId,
        tx_date: approved.transaction.date,
        type: approved.transaction.type,
        amount: approved.transaction.amount,
        savings_delta: approved.transaction.savingsDelta,
        borrowed_delta: approved.transaction.borrowedDelta,
        related_borrow_request_id: approved.transaction.relatedBorrowRequestId,
        memo: approved.transaction.memo,
      })
      .select("id")
      .single();
    if (txError) throw txError;

    const { error: scheduleError } = await supabase.from("borrow_repayments").insert(
      approved.repaymentSchedule.map((item) => ({
        borrow_request_id: item.borrowRequestId,
        due_date: item.dueDate,
        amount: item.amount,
        paid_amount: item.paidAmount,
        status: item.status,
      })),
    );
    if (scheduleError) throw scheduleError;

    const auth4 = await requireParentSession();
    if (auth4.user) {
      await insertNotification({
        parentId: auth4.user.id,
        childId: request.childId,
        target: "child",
        type: "borrow_approved",
        title: "미리쓰기 승인",
        body: `${request.requestedAmount.toLocaleString()}원 미리쓰기가 승인됐어요! 상환 일정 ${approved.repaymentSchedule.length}건이 생성됐습니다.`,
      });
    }

    revalidatePath("/");
    revalidatePath("/approvals");
    revalidatePath(`/child/${request.childId}`);
    return {
      ok: true,
      data: { transactionId: String(txData.id), scheduleCount: approved.repaymentSchedule.length },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "미리쓰기 승인 실패." };
  }
}

export async function rejectBorrowRequestAction(input: {
  borrowRequestId: string;
}): Promise<ActionResult<{ id: string }>> {
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const request = bundle.borrowRequests.find((item) => item.id === input.borrowRequestId);

  if (!request) return { ok: false, error: "미리쓰기 요청을 찾을 수 없습니다." };

  if (!hasSupabaseEnv()) {
    return { ok: true, data: { id: `mock-rejected-${request.id}` } };
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from("borrow_requests")
      .update({ status: "rejected" })
      .eq("id", input.borrowRequestId);
    if (error) throw error;

    const auth5 = await requireParentSession();
    if (auth5.user) {
      await insertNotification({
        parentId: auth5.user.id,
        childId: request.childId,
        target: "child",
        type: "borrow_rejected",
        title: "미리쓰기 반려",
        body: `${request.requestedAmount.toLocaleString()}원 미리쓰기 요청이 반려됐어요.`,
      });
    }

    revalidatePath("/approvals");
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

  if (!hasSupabaseEnv()) {
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

  const result = await createBehaviorLogAction({ childId, behaviorRuleId, date, memo });
  return result.ok
    ? { ok: true, message: `행동 기록 완료: ${result.data?.id}` }
    : { ok: false, message: result.error ?? "행동 기록 실패." };
}

export async function submitTransactionForm(_: FormState, formData: FormData): Promise<FormState> {
  const childId = readString(formData, "childId");
  const date = readString(formData, "date");
  const type = readString(formData, "type") as
    | "allowance" | "reward" | "spend" | "save" | "unsave" | "borrow" | "repay" | "interest";
  const amount = Number(readString(formData, "amount"));
  const memo = readString(formData, "memo");

  if (!childId || !date || !memo || !Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "입력값이 올바르지 않습니다." };
  }

  const result = await createMoneyTransactionAction({ childId, date, type, amount, memo });
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

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : undefined;
}
