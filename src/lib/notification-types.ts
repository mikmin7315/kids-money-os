export type NotifTypeMeta = {
  type: string;
  label: string;
  target: "parent" | "child";
};

export const NOTIFICATION_TYPES: NotifTypeMeta[] = [
  { type: "behavior_check_requested", label: "행동약속 확인 요청", target: "parent" },
  { type: "behavior_approved", label: "행동약속 승인", target: "child" },
  { type: "behavior_rejected", label: "행동약속 반려", target: "child" },
  { type: "borrow_requested", label: "미리쓰기 요청", target: "parent" },
  { type: "borrow_auto_approved", label: "미리쓰기 자동승인", target: "child" },
  { type: "borrow_approved", label: "미리쓰기 승인", target: "child" },
  { type: "borrow_rejected", label: "미리쓰기 반려", target: "child" },
  { type: "allowance_failed", label: "용돈 지급 실패", target: "parent" },
];
