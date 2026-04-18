import { buildActivityFeed, computeMonthlyReport, computeWallet } from "@/lib/finance";
import {
  AllowanceRule,
  BehaviorLog,
  BehaviorRule,
  BorrowRepayment,
  BorrowRequest,
  DashboardData,
  InterestPolicy,
  InterestRateEvent,
  MoneyTransaction,
  ParentProfile,
} from "@/lib/types";

const today = new Date().toISOString().slice(0, 10);
const now = new Date();
const thisYear = now.getFullYear();
const thisMonth = now.getMonth() + 1;
const monthKey = `${thisYear}-${String(thisMonth).padStart(2, "0")}`;

export const parentProfile: ParentProfile = {
  id: "parent-1",
  email: "mom@example.com",
  name: "김서윤",
  role: "parent",
  createdAt: `${monthKey}-01T09:00:00+09:00`,
};

export const children = [
  {
    id: "child-sia",
    parentId: parentProfile.id,
    name: "윤시아",
    nickname: "시아",
    birthYear: 2017,
    createdAt: `${monthKey}-01T09:00:00+09:00`,
  },
  {
    id: "child-min",
    parentId: parentProfile.id,
    name: "박민준",
    nickname: "민준",
    birthYear: 2015,
    createdAt: `${monthKey}-01T09:00:00+09:00`,
  },
] as const;

export const behaviorRules: BehaviorRule[] = [
  {
    id: "rule-early",
    parentId: parentProfile.id,
    title: "7시 전에 일어나기",
    description: "아침 루틴 성공 시 보상과 이자율이 올라가요.",
    rewardAmount: 500,
    interestDelta: 0.5,
    requiresParentApproval: false,
    isActive: true,
    createdAt: `${monthKey}-01T09:00:00+09:00`,
  },
  {
    id: "rule-homework",
    parentId: parentProfile.id,
    title: "숙제 완료",
    description: "숙제 완료는 부모 확인이 필요해요.",
    rewardAmount: 1000,
    interestDelta: 0.2,
    requiresParentApproval: true,
    isActive: true,
    createdAt: `${monthKey}-01T09:00:00+09:00`,
  },
  {
    id: "rule-reading",
    parentId: parentProfile.id,
    title: "20분 독서",
    description: "매일 독서 습관을 기르는 약속이에요.",
    rewardAmount: 300,
    interestDelta: 0,
    requiresParentApproval: false,
    isActive: true,
    createdAt: `${monthKey}-01T09:00:00+09:00`,
  },
];

export const behaviorLogs: BehaviorLog[] = [
  {
    id: "log-1",
    childId: "child-sia",
    behaviorRuleId: "rule-early",
    date: today,
    status: "completed",
    memo: "혼자 일어났어요.",
    createdAt: `${today}T07:10:00+09:00`,
  },
  {
    id: "log-2",
    childId: "child-sia",
    behaviorRuleId: "rule-homework",
    date: today,
    status: "pending",
    memo: "수학 문제집 완료.",
    createdAt: `${today}T18:30:00+09:00`,
  },
  {
    id: "log-3",
    childId: "child-sia",
    behaviorRuleId: "rule-reading",
    date: `${monthKey}-16`,
    status: "approved",
    createdAt: `${monthKey}-16T20:00:00+09:00`,
  },
  {
    id: "log-4",
    childId: "child-min",
    behaviorRuleId: "rule-homework",
    date: `${monthKey}-17`,
    status: "approved",
    createdAt: `${monthKey}-17T19:20:00+09:00`,
  },
  {
    id: "log-5",
    childId: "child-min",
    behaviorRuleId: "rule-early",
    date: today,
    status: "rejected",
    memo: "주말에 늦잠.",
    createdAt: `${today}T08:10:00+09:00`,
  },
];

export const allowanceRules: AllowanceRule[] = [
  {
    id: "allowance-weekly-sia",
    parentId: parentProfile.id,
    childId: "child-sia",
    type: "weekly",
    title: "주간 용돈",
    amount: 3000,
    weekday: 6,
    isActive: true,
    createdAt: `${monthKey}-01T09:00:00+09:00`,
  },
  {
    id: "allowance-weekly-min",
    parentId: parentProfile.id,
    childId: "child-min",
    type: "weekly",
    title: "주간 용돈",
    amount: 4000,
    weekday: 6,
    isActive: true,
    createdAt: `${monthKey}-01T09:00:00+09:00`,
  },
];

export const interestPolicies: InterestPolicy[] = [
  {
    id: "interest-sia",
    parentId: parentProfile.id,
    childId: "child-sia",
    baseInterestRate: 4,
    minInterestRate: 1,
    maxInterestRate: 8,
    settlementCycle: "monthly",
    createdAt: `${monthKey}-01T09:00:00+09:00`,
  },
  {
    id: "interest-min",
    parentId: parentProfile.id,
    childId: "child-min",
    baseInterestRate: 3.5,
    minInterestRate: 1,
    maxInterestRate: 7,
    settlementCycle: "monthly",
    createdAt: `${monthKey}-01T09:00:00+09:00`,
  },
];

export const interestRateEvents: InterestRateEvent[] = [
  {
    id: "rate-1",
    childId: "child-sia",
    behaviorRuleId: "rule-early",
    rateDelta: 0.5,
    appliedRate: 4.5,
    reason: "아침 루틴 5일 연속 달성.",
    effectiveDate: today,
    createdAt: `${today}T09:00:00+09:00`,
  },
  {
    id: "rate-2",
    childId: "child-min",
    behaviorRuleId: "rule-homework",
    rateDelta: 0.2,
    appliedRate: 3.7,
    reason: "숙제 연속 달성.",
    effectiveDate: `${monthKey}-17`,
    createdAt: `${monthKey}-17T09:00:00+09:00`,
  },
];

export const moneyTransactions: MoneyTransaction[] = [
  {
    id: "tx-1",
    childId: "child-sia",
    date: `${monthKey}-05`,
    type: "allowance",
    amount: 3000,
    savingsDelta: 0,
    borrowedDelta: 0,
    memo: "주간 용돈.",
    createdAt: `${monthKey}-05T09:00:00+09:00`,
  },
  {
    id: "tx-2",
    childId: "child-sia",
    date: `${monthKey}-06`,
    type: "save",
    amount: 1000,
    savingsDelta: 1000,
    borrowedDelta: 0,
    memo: "일부 저축.",
    createdAt: `${monthKey}-06T09:00:00+09:00`,
  },
  {
    id: "tx-3",
    childId: "child-sia",
    date: `${monthKey}-10`,
    type: "spend",
    amount: 2500,
    savingsDelta: 0,
    borrowedDelta: 0,
    memo: "문구점에서 스티커 구매.",
    createdAt: `${monthKey}-10T09:00:00+09:00`,
  },
  {
    id: "tx-4",
    childId: "child-sia",
    date: `${monthKey}-12`,
    type: "borrow",
    amount: 5000,
    savingsDelta: 0,
    borrowedDelta: 5000,
    relatedBorrowRequestId: "borrow-1",
    memo: "장난감 미리쓰기 승인.",
    createdAt: `${monthKey}-12T09:00:00+09:00`,
  },
  {
    id: "tx-5",
    childId: "child-sia",
    date: `${monthKey}-15`,
    type: "repay",
    amount: 2000,
    savingsDelta: 0,
    borrowedDelta: -2000,
    relatedBorrowRequestId: "borrow-1",
    memo: "1차 상환.",
    createdAt: `${monthKey}-15T09:00:00+09:00`,
  },
  {
    id: "tx-6",
    childId: "child-sia",
    date: `${monthKey}-16`,
    type: "reward",
    amount: 300,
    savingsDelta: 0,
    borrowedDelta: 0,
    relatedBehaviorLogId: "log-3",
    memo: "독서 습관 보상.",
    createdAt: `${monthKey}-16T09:00:00+09:00`,
  },
  {
    id: "tx-7",
    childId: "child-sia",
    date: today,
    type: "interest",
    amount: 120,
    savingsDelta: 0,
    borrowedDelta: 0,
    memo: "이번달 이자 예시.",
    createdAt: `${today}T09:00:00+09:00`,
  },
  {
    id: "tx-8",
    childId: "child-min",
    date: `${monthKey}-05`,
    type: "allowance",
    amount: 4000,
    savingsDelta: 0,
    borrowedDelta: 0,
    memo: "주간 용돈.",
    createdAt: `${monthKey}-05T09:00:00+09:00`,
  },
  {
    id: "tx-9",
    childId: "child-min",
    date: `${monthKey}-07`,
    type: "save",
    amount: 1500,
    savingsDelta: 1500,
    borrowedDelta: 0,
    memo: "일부 저축.",
    createdAt: `${monthKey}-07T09:00:00+09:00`,
  },
  {
    id: "tx-10",
    childId: "child-min",
    date: `${monthKey}-13`,
    type: "spend",
    amount: 1800,
    savingsDelta: 0,
    borrowedDelta: 0,
    memo: "방과후 준비물 구매.",
    createdAt: `${monthKey}-13T09:00:00+09:00`,
  },
  {
    id: "tx-11",
    childId: "child-min",
    date: `${monthKey}-17`,
    type: "reward",
    amount: 1000,
    savingsDelta: 0,
    borrowedDelta: 0,
    relatedBehaviorLogId: "log-4",
    memo: "숙제 보상.",
    createdAt: `${monthKey}-17T09:00:00+09:00`,
  },
];

export const borrowRequests: BorrowRequest[] = [
  {
    id: "borrow-1",
    childId: "child-sia",
    requestedAmount: 5000,
    purpose: "캐릭터 장난감 구매",
    status: "partial",
    repaymentMode: "installment",
    installmentCount: 2,
    interestRate: 2,
    createdAt: `${monthKey}-12T09:00:00+09:00`,
  },
  {
    id: "borrow-2",
    childId: "child-min",
    requestedAmount: 7000,
    purpose: "과학 키트 사전 구매",
    status: "pending",
    repaymentMode: "next_allowance",
    interestRate: 1,
    createdAt: `${today}T09:00:00+09:00`,
  },
];

export const borrowRepayments: BorrowRepayment[] = [
  {
    id: "repayment-1",
    borrowRequestId: "borrow-1",
    dueDate: `${monthKey}-19`,
    amount: 2550,
    paidAmount: 2000,
    status: "partial",
    createdAt: `${monthKey}-12T09:00:00+09:00`,
  },
  {
    id: "repayment-2",
    borrowRequestId: "borrow-1",
    dueDate: `${monthKey}-26`,
    amount: 2550,
    paidAmount: 0,
    status: "scheduled",
    createdAt: `${monthKey}-12T09:00:00+09:00`,
  },
];

function currentRateForChild(childId: string, fallback: number) {
  return interestRateEvents.find((event) => event.childId === childId)?.appliedRate ?? fallback;
}

export function getDashboardData(): DashboardData {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const todayStr = now.toISOString().slice(0, 10);

  const summaries = children.map((child) => {
    const baseRate = interestPolicies.find((policy) => policy.childId === child.id)?.baseInterestRate ?? 0;
    const wallet = computeWallet(child.id, moneyTransactions, currentRateForChild(child.id, baseRate));
    const monthReport = computeMonthlyReport(child.id, year, month, moneyTransactions, behaviorLogs);
    const pendingApprovals =
      behaviorLogs.filter((log) => log.childId === child.id && log.status === "pending").length +
      borrowRequests.filter((req) => req.childId === child.id && req.status === "pending").length;

    return {
      child,
      wallet,
      monthReport,
      pendingApprovals,
      todaysBehaviorCount: behaviorLogs.filter((log) => log.childId === child.id && log.date === todayStr).length,
    };
  });

  return {
    parent: parentProfile,
    children: summaries,
    pendingApprovals: borrowRequests.filter((req) => req.status === "pending"),
    activityFeed: buildActivityFeed(behaviorRules, behaviorLogs, moneyTransactions, borrowRequests),
  };
}
