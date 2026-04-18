import {
  ActivityItem,
  BehaviorLog,
  BehaviorRule,
  BorrowRepayment,
  BorrowRequest,
  InterestPolicy,
  MonthlyReport,
  MoneyTransaction,
  Wallet,
} from "@/lib/types";

export function computeWallet(
  childId: string,
  transactions: MoneyTransaction[],
  currentInterestRate: number,
): Wallet {
  const state = transactions
    .filter((tx) => tx.childId === childId)
    .reduce(
      (acc, tx) => ({
        balance: acc.balance + getCashDelta(tx),
        savingsBalance: acc.savingsBalance + tx.savingsDelta,
        borrowedBalance: acc.borrowedBalance + tx.borrowedDelta,
      }),
      { balance: 0, savingsBalance: 0, borrowedBalance: 0 },
    );

  return {
    childId,
    balance: state.balance,
    savingsBalance: state.savingsBalance,
    borrowedBalance: state.borrowedBalance,
    currentInterestRate,
    updatedAt: new Date().toISOString(),
  };
}

export function computeMonthlyReport(
  childId: string,
  year: number,
  month: number,
  transactions: MoneyTransaction[],
  behaviorLogs: BehaviorLog[],
): MonthlyReport {
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const childTx = transactions.filter((tx) => tx.childId === childId && tx.date.startsWith(monthKey));
  const childLogs = behaviorLogs.filter((log) => log.childId === childId && log.date.startsWith(monthKey));
  const successCount = childLogs.filter((log) => ["completed", "approved"].includes(log.status)).length;

  return {
    childId,
    year,
    month,
    totalAllowance: sumByTypes(childTx, ["allowance", "reward"]),
    totalSpend: sumByTypes(childTx, ["spend"]),
    totalSave: sumByTypes(childTx, ["save"]),
    totalInterest: sumByTypes(childTx, ["interest"]),
    totalBorrowed: sumByTypes(childTx, ["borrow"]),
    behaviorSuccessRate: childLogs.length ? (successCount / childLogs.length) * 100 : 0,
  };
}

export function estimateInterest(wallet: Wallet, policy: InterestPolicy) {
  const periodRate =
    policy.settlementCycle === "monthly"
      ? wallet.currentInterestRate / 100 / 12
      : wallet.currentInterestRate / 100 / 52;

  return Math.round(wallet.savingsBalance * periodRate);
}

export function buildActivityFeed(
  behaviorRules: BehaviorRule[],
  behaviorLogs: BehaviorLog[],
  transactions: MoneyTransaction[],
  borrowRequests: BorrowRequest[],
): ActivityItem[] {
  const activities: ActivityItem[] = [
    ...behaviorLogs.map((log) => ({
      id: log.id,
      childId: log.childId,
      date: log.date,
      title: behaviorRules.find((rule) => rule.id === log.behaviorRuleId)?.title ?? "행동 기록",
      description: `상태: ${log.status}`,
      kind: "behavior" as const,
      accent: "sky" as const,
    })),
    ...transactions.map((tx) => ({
      id: tx.id,
      childId: tx.childId,
      date: tx.date,
      title: transactionLabel(tx.type),
      description: tx.memo,
      kind: "money" as const,
      amount: tx.amount,
      accent: transactionAccent(tx.type),
    })),
    ...borrowRequests.map((request) => ({
      id: request.id,
      childId: request.childId,
      date: request.createdAt.slice(0, 10),
      title: "미리쓰기 요청",
      description: `${request.status} | ${request.purpose}`,
      kind: "borrow" as const,
      amount: request.requestedAmount,
      accent: "amber" as const,
    })),
  ];

  return activities.sort((a, b) => b.date.localeCompare(a.date));
}

export function approveBorrowRequest(input: {
  request: BorrowRequest;
  approvalDate: string;
}): {
  transaction: MoneyTransaction;
  repaymentSchedule: BorrowRepayment[];
} {
  const { request, approvalDate } = input;
  const installments = request.repaymentMode === "installment" ? request.installmentCount ?? 3 : 1;

  // interest rate is treated as a one-time fee (not annualised) for the loan period
  const totalRepayable = Math.ceil(request.requestedAmount * (1 + request.interestRate / 100));
  const installmentAmount = Math.ceil(totalRepayable / installments);
  const now = new Date().toISOString();

  return {
    transaction: {
      id: crypto.randomUUID(),
      childId: request.childId,
      date: approvalDate,
      type: "borrow",
      amount: request.requestedAmount,
      savingsDelta: 0,
      borrowedDelta: request.requestedAmount,
      relatedBorrowRequestId: request.id,
      memo: `${request.purpose} 미리쓰기 승인`,
      createdAt: now,
    },
    repaymentSchedule: Array.from({ length: installments }, (_, index) => ({
      id: crypto.randomUUID(),
      borrowRequestId: request.id,
      dueDate: addWeeks(approvalDate, index + 1),
      amount: installmentAmount,
      paidAmount: 0,
      status: "scheduled" as const,
      createdAt: now,
    })),
  };
}

export function createMoneyTransaction(input: {
  childId: string;
  date: string;
  type: MoneyTransaction["type"];
  amount: number;
  memo: string;
}): MoneyTransaction {
  return {
    id: crypto.randomUUID(),
    childId: input.childId,
    date: input.date,
    type: input.type,
    amount: input.amount,
    savingsDelta: input.type === "save" ? input.amount : input.type === "unsave" ? -input.amount : 0,
    borrowedDelta: input.type === "borrow" ? input.amount : input.type === "repay" ? -input.amount : 0,
    memo: input.memo,
    createdAt: new Date().toISOString(),
  };
}

function sumByTypes(transactions: MoneyTransaction[], types: MoneyTransaction["type"][]) {
  return transactions.filter((tx) => types.includes(tx.type)).reduce((sum, tx) => sum + tx.amount, 0);
}

function getCashDelta(tx: MoneyTransaction) {
  switch (tx.type) {
    case "allowance":
    case "reward":
    case "interest":
    case "borrow":
    case "unsave":
      return tx.amount;
    case "spend":
    case "save":
    case "repay":
      return -tx.amount;
  }
}

function transactionLabel(type: MoneyTransaction["type"]) {
  const labels: Record<MoneyTransaction["type"], string> = {
    allowance: "용돈",
    reward: "보상",
    spend: "지출",
    save: "저축",
    unsave: "저축 인출",
    borrow: "미리쓰기",
    repay: "상환",
    interest: "이자",
  };
  return labels[type];
}

function transactionAccent(type: MoneyTransaction["type"]): ActivityItem["accent"] {
  if (type === "spend" || type === "repay") return "rose";
  if (type === "save" || type === "interest") return "emerald";
  if (type === "borrow") return "amber";
  return "sky";
}

function addWeeks(date: string, count: number) {
  const parsed = new Date(date);
  parsed.setDate(parsed.getDate() + count * 7);
  return parsed.toISOString().slice(0, 10);
}
