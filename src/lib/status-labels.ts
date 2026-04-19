import type { BehaviorLogStatus, BorrowStatus, RepaymentStatus } from "./types";

export type StatusTone = "neutral" | "sky" | "emerald" | "amber" | "rose";

export interface StatusDisplay {
  label: string;
  icon: string;
  tone: StatusTone;
  description?: string;
}

export const behaviorStatusDisplay: Record<BehaviorLogStatus, StatusDisplay> = {
  pending: {
    label: "확인 대기",
    icon: "⏳",
    tone: "amber",
    description: "부모 확인을 기다리고 있어요",
  },
  completed: {
    label: "완료",
    icon: "✓",
    tone: "emerald",
    description: "약속을 지켰어요",
  },
  approved: {
    label: "확인됨",
    icon: "✓",
    tone: "emerald",
    description: "부모가 확인했어요",
  },
  rejected: {
    label: "다시 도전",
    icon: "↩",
    tone: "neutral",
    description: "아직 기회가 있어요",
  },
};

export const borrowStatusDisplay: Record<BorrowStatus, StatusDisplay> = {
  pending: {
    label: "확인 대기",
    icon: "⏳",
    tone: "amber",
    description: "부모 확인을 기다리고 있어요",
  },
  approved: {
    label: "허락됨",
    icon: "✓",
    tone: "emerald",
    description: "미리쓰기가 허락됐어요",
  },
  rejected: {
    label: "보류됨",
    icon: "·",
    tone: "neutral",
    description: "이번엔 조금 더 이야기해봐요",
  },
  partial: {
    label: "상환 중",
    icon: "↑",
    tone: "sky",
    description: "조금씩 갚아가고 있어요",
  },
  repaid: {
    label: "정산 완료",
    icon: "✓",
    tone: "emerald",
    description: "모두 갚았어요",
  },
};

export const repaymentStatusDisplay: Record<RepaymentStatus, StatusDisplay> = {
  scheduled: {
    label: "정산 예정",
    icon: "○",
    tone: "sky",
    description: "아직 정산 전이에요",
  },
  partial: {
    label: "일부 상환",
    icon: "◑",
    tone: "amber",
    description: "일부만 갚았어요",
  },
  paid: {
    label: "완납",
    icon: "✓",
    tone: "emerald",
    description: "모두 갚았어요",
  },
  overdue: {
    label: "정산 지연",
    icon: "!",
    tone: "amber",
    description: "정산을 같이 확인해봐요",
  },
};

export const transactionTypeLabel: Record<string, { label: string; icon: string }> = {
  allowance: { label: "용돈", icon: "💰" },
  reward: { label: "약속 보상", icon: "🌟" },
  spend: { label: "지출", icon: "💸" },
  save: { label: "저축", icon: "🐷" },
  unsave: { label: "저축 인출", icon: "↩" },
  borrow: { label: "미리쓰기", icon: "⏩" },
  repay: { label: "상환", icon: "↑" },
  interest: { label: "이자 정산", icon: "📈" },
};

export const notificationTypeLabel: Record<string, { label: string; icon: string }> = {
  behavior_check_requested: { label: "약속 확인 요청", icon: "🤝" },
  behavior_approved: { label: "약속 확인됨", icon: "✓" },
  behavior_rejected: { label: "약속 다시 도전", icon: "↩" },
  borrow_requested: { label: "미리쓰기 요청", icon: "💳" },
  borrow_approved: { label: "미리쓰기 허락됨", icon: "✓" },
  borrow_rejected: { label: "미리쓰기 보류", icon: "·" },
  monthly_settlement: { label: "이번달 정산", icon: "📋" },
};
