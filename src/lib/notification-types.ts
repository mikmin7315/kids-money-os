export type NotifTypeMeta = {
  type: string;
  label: string;
  target: "parent" | "child";
};

export const NOTIFICATION_TYPES: NotifTypeMeta[] = [
  { type: "stale_behavior_approval", label: "3일 이상 기다린 약속 승인", target: "parent" },
  { type: "daily_behavior_reminder", label: "매일 약속 기록 리마인더", target: "child" },
  { type: "behavior_check_requested", label: "행동약속 확인 요청", target: "parent" },
  { type: "behavior_approved", label: "행동약속 승인", target: "child" },
  { type: "behavior_rejected", label: "행동약속 반려", target: "child" },
  { type: "borrow_requested", label: "미리쓰기 요청", target: "parent" },
  { type: "borrow_auto_approved", label: "미리쓰기 자동승인", target: "child" },
  { type: "borrow_approved", label: "미리쓰기 승인", target: "child" },
  { type: "borrow_rejected", label: "미리쓰기 반려", target: "child" },
  { type: "allowance_failed", label: "용돈 지급 실패", target: "parent" },
  { type: "allowance_received", label: "용돈 받음", target: "child" },
  { type: "interest_settled", label: "이자 정산", target: "child" },
  { type: "goal_achieved", label: "목표 달성 (부모)", target: "parent" },
  { type: "goal_achieved_child", label: "목표 달성 (아이)", target: "child" },
];
