"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppNotification, markNotificationsReadAction } from "@/actions/notifications";

const TYPE_ICON: Record<string, string> = {
  behavior_check_requested: "📝",
  behavior_approved: "✅",
  behavior_rejected: "❌",
  borrow_requested: "💸",
  borrow_approved: "✅",
  borrow_rejected: "❌",
  monthly_settlement: "📊",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function NotificationList({ notifications }: { notifications: AppNotification[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);

  function markAllRead() {
    if (unreadIds.length === 0) return;
    startTransition(async () => {
      await markNotificationsReadAction(unreadIds);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {unreadIds.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAllRead}
            disabled={pending}
            className="rounded-full border border-[var(--color-border)] bg-white/80 px-4 py-2 text-xs font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
          >
            {pending ? "처리 중..." : "모두 읽음 처리"}
          </button>
        </div>
      )}

      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} onRead={() => {
          if (!n.isRead) {
            startTransition(async () => {
              await markNotificationsReadAction([n.id]);
              router.refresh();
            });
          }
        }} />
      ))}
    </div>
  );
}

function NotificationCard({
  notification: n,
  onRead,
}: {
  notification: AppNotification;
  onRead: () => void;
}) {
  return (
    <div
      onClick={onRead}
      className={`cursor-pointer rounded-[28px] border p-5 shadow-[0_18px_48px_rgba(48,36,24,0.10)] transition ${
        n.isRead
          ? "border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.7),rgba(249,243,234,0.95))]"
          : "border-[rgba(15,139,124,0.2)] bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none">{TYPE_ICON[n.type] ?? "🔔"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${n.isRead ? "text-[var(--color-muted)]" : "text-[var(--color-text)]"}`}>
              {n.title}
            </p>
            <span className="shrink-0 text-xs text-[var(--color-muted)]">{formatDate(n.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm leading-5 text-[var(--color-muted)]">{n.body}</p>
        </div>
        {!n.isRead && (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
        )}
      </div>
    </div>
  );
}
