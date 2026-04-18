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
  AllowanceRule,
  BehaviorLog,
  BehaviorRule,
  BorrowRepayment,
  BorrowRequest,
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
};

export async function getDashboardView(): Promise<DashboardData> {
  if (!hasSupabaseEnv()) return getDashboardData();

  try {
    const bundle = await fetchAppDataFromSupabase();
    return buildDashboardFromBundle(bundle);
  } catch {
    return getDashboardData();
  }
}

export async function getAppDataBundle(): Promise<AppDataBundle> {
  if (!hasSupabaseEnv()) return getMockBundle();

  try {
    return await fetchAppDataFromSupabase();
  } catch {
    return getMockBundle();
  }
}

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function fetchAppDataFromSupabase(): Promise<AppDataBundle> {
  const supabase = await getSupabaseServerClient();

  const [
    profilesRes,
    childrenRes,
    behaviorRulesRes,
    behaviorLogsRes,
    allowanceRulesRes,
    transactionsRes,
    borrowRequestsRes,
    borrowRepaymentsRes,
    interestPoliciesRes,
    interestRateEventsRes,
    walletSnapshotsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle(),
    supabase.from("children").select("*").order("created_at", { ascending: true }),
    supabase.from("behavior_rules").select("*").order("created_at", { ascending: true }),
    supabase.from("behavior_logs").select("*").order("behavior_date", { ascending: false }),
    supabase.from("allowance_rules").select("*").order("created_at", { ascending: true }),
    supabase.from("money_transactions").select("*").order("tx_date", { ascending: false }),
    supabase.from("borrow_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("borrow_repayments").select("*").order("due_date", { ascending: true }),
    supabase.from("interest_policies").select("*").order("created_at", { ascending: true }),
    supabase.from("interest_rate_events").select("*").order("effective_date", { ascending: false }),
    supabase.from("wallet_snapshots").select("*"),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (childrenRes.error) throw childrenRes.error;
  if (behaviorRulesRes.error) throw behaviorRulesRes.error;
  if (behaviorLogsRes.error) throw behaviorLogsRes.error;
  if (allowanceRulesRes.error) throw allowanceRulesRes.error;
  if (transactionsRes.error) throw transactionsRes.error;
  if (borrowRequestsRes.error) throw borrowRequestsRes.error;
  if (borrowRepaymentsRes.error) throw borrowRepaymentsRes.error;
  if (interestPoliciesRes.error) throw interestPoliciesRes.error;
  if (interestRateEventsRes.error) throw interestRateEventsRes.error;

  if (!profilesRes.data) throw new Error("Profile not found for current user.");

  const parent = mapProfile(profilesRes.data);
  const mappedChildren = (childrenRes.data ?? []).map(mapChild);
  const mappedBehaviorRules = (behaviorRulesRes.data ?? []).map(mapBehaviorRule);
  const mappedBehaviorLogs = (behaviorLogsRes.data ?? []).map(mapBehaviorLog);
  const mappedAllowanceRules = (allowanceRulesRes.data ?? []).map(mapAllowanceRule);
  const mappedTransactions = (transactionsRes.data ?? []).map(mapMoneyTransaction);
  const mappedBorrowRequests = (borrowRequestsRes.data ?? []).map(mapBorrowRequest);
  const mappedBorrowRepayments = (borrowRepaymentsRes.data ?? []).map(mapBorrowRepayment);
  const mappedInterestPolicies = (interestPoliciesRes.data ?? []).map(mapInterestPolicy);
  const mappedWalletSnapshots = (walletSnapshotsRes.data ?? []).map(mapWalletSnapshot);

  // Latest applied rate per child (from events, for policy display)
  const latestRates = new Map<string, number>();
  for (const event of interestRateEventsRes.data ?? []) {
    if (!latestRates.has(event.child_id)) latestRates.set(event.child_id, Number(event.applied_rate));
  }

  return {
    parent,
    children: mappedChildren,
    behaviorRules: mappedBehaviorRules,
    behaviorLogs: mappedBehaviorLogs,
    allowanceRules: mappedAllowanceRules,
    moneyTransactions: mappedTransactions,
    borrowRequests: mappedBorrowRequests,
    borrowRepayments: mappedBorrowRepayments,
    interestPolicies: mappedInterestPolicies.map((policy) => ({
      ...policy,
      baseInterestRate: latestRates.get(policy.childId) ?? policy.baseInterestRate,
    })),
    walletSnapshots: mappedWalletSnapshots,
  };
}

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
      ? { ...snapshot, currentInterestRate: currentRate }
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
