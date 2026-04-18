export type Role = "parent" | "child" | "admin";
export type BehaviorLogStatus = "pending" | "completed" | "approved" | "rejected";
export type AllowanceRuleType = "weekly" | "monthly" | "behavior_based" | "manual";
export type TransactionType =
  | "allowance"
  | "reward"
  | "spend"
  | "save"
  | "unsave"
  | "borrow"
  | "repay"
  | "interest";
export type BorrowStatus = "pending" | "approved" | "rejected" | "partial" | "repaid";
export type RepaymentMode = "next_allowance" | "installment";
export type RepaymentStatus = "scheduled" | "partial" | "paid" | "overdue";
export type SettlementCycle = "weekly" | "monthly";

export type ParentProfile = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
};

export type ChildProfile = {
  id: string;
  parentId: string;
  name: string;
  nickname: string;
  birthYear: number;
  createdAt: string;
};

export type BehaviorRule = {
  id: string;
  parentId: string;
  title: string;
  description: string;
  rewardAmount: number;
  interestDelta: number;
  requiresParentApproval: boolean;
  isActive: boolean;
  createdAt: string;
};

export type BehaviorLog = {
  id: string;
  childId: string;
  behaviorRuleId: string;
  date: string;
  status: BehaviorLogStatus;
  memo?: string;
  createdAt: string;
};

export type BehaviorScore = {
  id: string;
  childId: string;
  year: number;
  month: number;
  totalAttempts: number;
  successCount: number;
  computedScore: number;
  rateAdjustment: number;
  createdAt: string;
};

export type AllowanceRule = {
  id: string;
  parentId: string;
  childId: string;
  type: AllowanceRuleType;
  title: string;
  amount: number;
  weekday?: number;
  dayOfMonth?: number;
  isActive: boolean;
  createdAt: string;
};

export type Wallet = {
  childId: string;
  balance: number;
  savingsBalance: number;
  borrowedBalance: number;
  currentInterestRate: number;
  updatedAt: string;
};

export type MoneyTransaction = {
  id: string;
  childId: string;
  date: string;
  type: TransactionType;
  amount: number;
  savingsDelta: number;
  borrowedDelta: number;
  relatedBehaviorLogId?: string;
  relatedBorrowRequestId?: string;
  memo: string;
  createdAt: string;
};

export type BorrowRequest = {
  id: string;
  childId: string;
  requestedAmount: number;
  purpose: string;
  status: BorrowStatus;
  repaymentMode: RepaymentMode;
  installmentCount?: number;
  interestRate: number;
  createdAt: string;
};

export type BorrowRepayment = {
  id: string;
  borrowRequestId: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: RepaymentStatus;
  createdAt: string;
};

export type BorrowConditions = {
  id: string;
  parentId: string;
  childId: string;
  maxAmount: number;
  requiresPurpose: boolean;
  autoApproveBlow: number;
  createdAt: string;
};

export type InterestPolicy = {
  id: string;
  parentId: string;
  childId: string;
  baseInterestRate: number;
  minInterestRate: number;
  maxInterestRate: number;
  settlementCycle: SettlementCycle;
  createdAt: string;
};

export type InterestRateEvent = {
  id: string;
  childId: string;
  behaviorRuleId?: string;
  rateDelta: number;
  appliedRate: number;
  reason: string;
  effectiveDate: string;
  createdAt: string;
};

export type MonthlyReport = {
  childId: string;
  year: number;
  month: number;
  totalAllowance: number;
  totalSpend: number;
  totalSave: number;
  totalInterest: number;
  totalBorrowed: number;
  behaviorSuccessRate: number;
};

export type PeerStat = {
  id: string;
  year: number;
  month: number;
  ageGroup: string;
  avgBehaviorScore: number;
  avgSavingsRate: number;
  avgInterestRate: number;
  sampleCount: number;
  createdAt: string;
};

export type ActivityItem = {
  id: string;
  childId: string;
  date: string;
  title: string;
  description: string;
  kind: "behavior" | "money" | "borrow";
  amount?: number;
  accent: "sky" | "emerald" | "amber" | "rose";
};

export type ChildSummary = {
  child: ChildProfile;
  wallet: Wallet;
  monthReport: MonthlyReport;
  pendingApprovals: number;
  todaysBehaviorCount: number;
};

export type DashboardData = {
  parent: ParentProfile;
  children: ChildSummary[];
  pendingApprovals: BorrowRequest[];
  activityFeed: ActivityItem[];
};
