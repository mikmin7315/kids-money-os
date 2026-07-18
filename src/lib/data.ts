import { unstable_cache, revalidateTag } from "next/cache";
import { getAuthContext } from "@/lib/auth";
import { buildActivityFeed, computeMonthlyReport, computeWallet } from "@/lib/finance";
import {
  allowanceRules,
  behaviorLogs,
  behaviorRules,
  borrowRepayments,
  borrowRequests,
  children,
  getDashboardData,
  interestPolicies,
  moneyTransactions,
  parentProfile,
} from "@/lib/mock-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  AllowanceExecution,
  AllowanceRule,
  BehaviorLog,
  BehaviorRule,
  BorrowRepayment,
  BorrowRequest,
  CashSpendRequest,
  ChildProfile,
  DashboardData,
  InterestPolicy,
  MoneyTransaction,
  ParentProfile,
  Wallet,
} from "@/lib/types";

export type AppDataBundle = {
  parent: ParentProfile;
  children: ChildProfile[];
  behaviorRules: BehaviorRule[];
  behaviorLogs: BehaviorLog[];
  allowanceRules: AllowanceRule[];
  moneyTransactions: MoneyTransaction[];
  borrowRequests: BorrowRequest[];
  borrowRepayments: BorrowRepayment[];
  interestPolicies: InterestPolicy[];
  walletSnapshots: Wallet[];
  cashSpendRequests: CashSpendRequest[];
  allowanceExecutions: AllowanceExecution[];
};

export async function getDashboardView(): Promise<DashboardData> {
  if (isDemoMode()) return getDashboardData();

  const bundle = await getAppDataBundle();
  return buildDashboardFromBundle(bundle);
}

export async function getAppDataBundle(): Promise<AppDataBundle> {
  if (isDemoMode()) return getMockBundle();

  const auth = await getAuthContext();
  if (!auth.user || !auth.profile) throw new Error("Profile not found for current user.");

  const userId = auth.user.id;
  return unstable_cache(
    fetchAppDataFromSupabase,
    ["app-data", userId],
    { tags: [`app-data-${userId}`], revalidate: 30 },
  )();
}

/** 서버 액션에서 데이터 변경 후 호출 — 해당 유저의 캐시를 즉시 무효화 */
export async function invalidateAppData(): Promise<void> {
  const auth = await getAuthContext();
  if (auth.user) revalidateTag(`app-data-${auth.user.id}`, "default");
}

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isDemoMode() {
  return process.env.NODE_ENV !== "production" && !hasSupabaseEnv();
}

const fetchAppDataFromSupabase = async (): Promise<AppDataBundle> => {
  const auth = await getAuthContext();
  if (!auth.user || !auth.profile) throw new Error("Profile not found for current user.");

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_app_data_bundle");
  if (error) throw error;
  const rows = (data ?? {}) as Record<string, Record<string, unknown>[]>;

  const parent = mapProfile(auth.profile);
  const mappedChildren = (rows.children ?? []).map(mapChild);
  const mappedBehaviorRules = (rows.behavior_rules ?? []).map(mapBehaviorRule);
  const mappedBehaviorLogs = (rows.behavior_logs ?? []).map(mapBehaviorLog);
  const mappedAllowanceRules = (rows.allowance_rules ?? []).map(mapAllowanceRule);
  const mappedTransactions = (rows.money_transactions ?? []).map(mapMoneyTransaction);
  const mappedBorrowRequests = (rows.borrow_requests ?? []).map(mapBorrowRequest);
  const mappedBorrowRepayments = (rows.borrow_repayments ?? []).map(mapBorrowRepayment);
  const mappedInterestPolicies = (rows.interest_policies ?? []).map(mapInterestPolicy);
  const mappedWalletSnapshots = (rows.wallet_snapshots ?? []).map(mapWalletSnapshot);

  // cash_spend_requests, allowance_executions: fetch separately
  const childIds = mappedChildren.map((c) => c.id);
  const [cashResult, execResult] = await Promise.all([
    supabase
      .from("cash_spend_requests")
      .select("id,child_id,amount,spend_date,memo,status,reviewed_by,reviewed_at,rejection_reason,created_at")
      .in("child_id", childIds)
      .order("created_at", { ascending: false })
      .limit(100),
    childIds.length > 0
      ? supabase
          .from("allowance_executions")
          .select("id,allowance_rule_id,scheduled_date,status,failure_reason,executed_at")
          .in("allowance_rule_id",
            (rows.allowance_rules ?? []).map((r) => (r as Record<string, unknown>).id as string))
          .order("scheduled_date", { ascending: false })
          .limit(60)
      : Promise.resolve({ data: [] }),
  ]);

  const mappedCashRequests = (cashResult.data ?? []).map(mapCashSpendRequest);
  const mappedExecutions = ((execResult.data ?? []) as Record<string, unknown>[]).map(
    (r): AllowanceExecution => ({
      id: String(r.id),
      allowanceRuleId: String(r.allowance_rule_id),
      scheduledDate: String(r.scheduled_date),
      status: r.status as AllowanceExecution["status"],
      failureReason: r.failure_reason ? String(r.failure_reason) : null,
      executedAt: r.executed_at ? String(r.executed_at) : null,
    })
  );

  return {
    parent,
    children: mappedChildren,
    behaviorRules: mappedBehaviorRules,
    behaviorLogs: mappedBehaviorLogs,
    allowanceRules: mappedAllowanceRules,
    moneyTransactions: mappedTransactions,
    borrowRequests: mappedBorrowRequests,
    borrowRepayments: mappedBorrowRepayments,
    interestPolicies: mappedInterestPolicies,
    walletSnapshots: mappedWalletSnapshots,
    cashSpendRequests: mappedCashRequests,
    allowanceExecutions: mappedExecutions,
  };
};

function buildDashboardFromBundle(bundle: AppDataBundle): DashboardData {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.toISOString().slice(0, 10);

  const childSummaries = bundle.children.map((child) => {
    const policy = bundle.interestPolicies.find((item) => item.childId === child.id);
    const currentRate = policy?.baseInterestRate ?? 0;

    // Prefer wallet_snapshots (maintained by DB trigger); fall back to computing from transactions
    const snapshot = bundle.walletSnapshots.find((w) => w.childId === child.id);
    const wallet: Wallet = snapshot
      ? snapshot
      : computeWallet(child.id, bundle.moneyTransactions, currentRate);

    const monthReport = computeMonthlyReport(child.id, year, month, bundle.moneyTransactions, bundle.behaviorLogs);

    const pendingApprovals =
      bundle.behaviorLogs.filter((log) => log.childId === child.id && log.status === "pending").length +
      bundle.borrowRequests.filter((req) => req.childId === child.id && req.status === "pending").length;

    return {
      child,
      wallet,
      monthReport,
      pendingApprovals,
      todaysBehaviorCount: bundle.behaviorLogs.filter(
        (log) => log.childId === child.id && log.date === today,
      ).length,
    };
  });

  return {
    parent: bundle.parent,
    children: childSummaries,
    pendingApprovals: bundle.borrowRequests.filter((req) => req.status === "pending"),
    activityFeed: buildActivityFeed(
      bundle.behaviorRules,
      bundle.behaviorLogs,
      bundle.moneyTransactions,
      bundle.borrowRequests,
    ),
  };
}

function getMockBundle(): AppDataBundle {
  return {
    parent: parentProfile,
    children: [...children],
    behaviorRules,
    behaviorLogs,
    allowanceRules,
    moneyTransactions,
    borrowRequests,
    borrowRepayments,
    interestPolicies,
    walletSnapshots: [],
    cashSpendRequests: [],
    allowanceExecutions: [],
  };
}

function mapProfile(row: Record<string, unknown>): ParentProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    name: String(row.name),
    role: "parent",
    createdAt: String(row.created_at),
  };
}

function mapChild(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    parentId: String(row.parent_id),
    name: String(row.name),
    nickname: String(row.nickname ?? row.name),
    birthYear: Number(row.birth_year),
    createdAt: String(row.created_at),
  };
}

function mapBehaviorRule(row: Record<string, unknown>): BehaviorRule {
  return {
    id: String(row.id),
    parentId: String(row.parent_id),
    title: String(row.title),
    description: String(row.description ?? ""),
    rewardAmount: Number(row.reward_amount ?? 0),
    interestDelta: Number(row.interest_delta ?? 0),
    ruleCategory: (row.rule_category as BehaviorRule["ruleCategory"]) ?? "recurring",
    monthlyTargetRate: Number(row.monthly_target_rate ?? 80),
    requiresParentApproval: Boolean(row.requires_parent_approval),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
  };
}

function mapBehaviorLog(row: Record<string, unknown>): BehaviorLog {
  return {
    id: String(row.id),
    childId: String(row.child_id),
    behaviorRuleId: String(row.behavior_rule_id),
    date: String(row.behavior_date),
    status: row.status as BehaviorLog["status"],
    memo: row.memo ? String(row.memo) : undefined,
    createdAt: String(row.created_at),
  };
}

function mapAllowanceRule(row: Record<string, unknown>): AllowanceRule {
  return {
    id: String(row.id),
    parentId: String(row.parent_id),
    childId: String(row.child_id),
    type: row.type as AllowanceRule["type"],
    title: String(row.title),
    amount: Number(row.amount),
    weekday: row.weekday ? Number(row.weekday) : undefined,
    dayOfMonth: row.day_of_month ? Number(row.day_of_month) : undefined,
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    deletedAt: row.deleted_at ? String(row.deleted_at) : undefined,
  };
}

function mapMoneyTransaction(row: Record<string, unknown>): MoneyTransaction {
  return {
    id: String(row.id),
    childId: String(row.child_id),
    date: String(row.tx_date),
    type: row.type as MoneyTransaction["type"],
    amount: Number(row.amount),
    savingsDelta: Number(row.savings_delta ?? 0),
    borrowedDelta: Number(row.borrowed_delta ?? 0),
    relatedBehaviorLogId: row.related_behavior_log_id ? String(row.related_behavior_log_id) : undefined,
    relatedBorrowRequestId: row.related_borrow_request_id ? String(row.related_borrow_request_id) : undefined,
    memo: String(row.memo ?? ""),
    createdAt: String(row.created_at),
  };
}

function mapBorrowRequest(row: Record<string, unknown>): BorrowRequest {
  return {
    id: String(row.id),
    childId: String(row.child_id),
    requestedAmount: Number(row.requested_amount),
    purpose: String(row.purpose ?? ""),
    status: row.status as BorrowRequest["status"],
    repaymentMode: row.repayment_mode as BorrowRequest["repaymentMode"],
    installmentCount: row.installment_count ? Number(row.installment_count) : undefined,
    interestRate: Number(row.interest_rate ?? 0),
    createdAt: String(row.created_at),
    repaidAt: row.repaid_at ? String(row.repaid_at) : undefined,
  };
}

function mapCashSpendRequest(row: Record<string, unknown>): CashSpendRequest {
  return {
    id: String(row.id),
    childId: String(row.child_id),
    amount: Number(row.amount),
    spendDate: String(row.spend_date),
    memo: row.memo ? String(row.memo) : undefined,
    status: row.status as CashSpendRequest["status"],
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    createdAt: String(row.created_at),
  };
}

function mapBorrowRepayment(row: Record<string, unknown>): BorrowRepayment {
  return {
    id: String(row.id),
    borrowRequestId: String(row.borrow_request_id),
    dueDate: String(row.due_date),
    amount: Number(row.amount),
    paidAmount: Number(row.paid_amount ?? 0),
    status: row.status as BorrowRepayment["status"],
    createdAt: String(row.created_at),
  };
}

function mapInterestPolicy(row: Record<string, unknown>): InterestPolicy {
  return {
    id: String(row.id),
    parentId: String(row.parent_id),
    childId: String(row.child_id),
    baseInterestRate: Number(row.base_interest_rate),
    minInterestRate: Number(row.min_interest_rate),
    maxInterestRate: Number(row.max_interest_rate),
    settlementCycle: row.settlement_cycle as InterestPolicy["settlementCycle"],
    createdAt: String(row.created_at),
  };
}

function mapWalletSnapshot(row: Record<string, unknown>): Wallet {
  return {
    childId: String(row.child_id),
    balance: Number(row.balance ?? 0),
    savingsBalance: Number(row.savings_balance ?? 0),
    borrowedBalance: Number(row.borrowed_balance ?? 0),
    currentInterestRate: Number(row.current_interest_rate ?? 0),
    updatedAt: String(row.updated_at),
  };
}
