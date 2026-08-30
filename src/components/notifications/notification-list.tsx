"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { SectionTitle } from "@/components/monari/ui";
import {
  fetchChildNotificationsAction,
  markNotificationsReadAction,
} from "@/lib/supabase/actions/notifications";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { type AppNotification, mapNotificationRow } from "@/lib/supabase/notification-types";

const TYPE_ICON: Record<string, string> = {
  behavior_check_requested: "📝",
  stale_behavior_approval: "⏰",
  behavior_approved: "✅",
  behavior_rejected: "❌",
  daily_behavior_reminder: "📅",
  borrow_requested: "💸",
  borrow_auto_approved: "✅",
  borrow_approved: "✅",
  borrow_rejected: "❌",
  allowance_failed: "⚠️",
  monthly_settlement: "📊",
  goal_achieved: "🎊",
  goal_achieved_child: "🎉",
};

function getNotificationUrl(notification: AppNotification, target: "parent" | "child"): string | null {
  const { type, childId } = notification;
  if (target === "parent") {
    if (type === "behavior_check_requested" || type === "stale_behavior_approval" || type === "borrow_requested") {
      return "/approvals";
    }
    if (type === "allowance_failed") return "/";
    if (type === "goal_achieved" && childId) return `/child/${childId}/goal`;
    return null;
  }
  // child target
  if (!childId) return null;
  if (type === "behavior_approved" || type === "behavior_rejected" || type === "daily_behavior_reminder") {
    return `/child/${childId}/promise`;
  }
  if (type === "borrow_approved" || type === "borrow_rejected" || type === "borrow_auto_approved") {
    return `/child/${childId}`;
  }
  if (type === "goal_achieved_child") {
    return `/child/${childId}/goal`;
  }
  return null;
}

type NotificationListProps = {
  initialNotifications: AppNotification[];
  parentId: string | null;
  target: "parent" | "child";
  childId: string | null;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const prefix = date.getFullYear() !== now.getFullYear() ? `${date.getFullYear()}년 ` : "";
  return `${prefix}${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function isVisibleNotification(
  notification: AppNotification,
  target: NotificationListProps["target"],
  childId: string | null,
) {
  return notification.target === target && (target === "parent" || notification.childId === childId);
}

export function NotificationList({
  initialNotifications,
  parentId,
  target,
  childId,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pending, startTransition] = useTransition();
  const unreadIds = useMemo(
    () => notifications.filter((notification) => !notification.isRead).map((notification) => notification.id),
    [notifications],
  );

  useEffect(() => {
    if (target === "child") {
      if (!childId) return;

      let cancelled = false;
      let timeout: number | undefined;

      const refresh = async () => {
        const result = await fetchChildNotificationsAction(childId);
        if (!cancelled && result.ok && result.data) setNotifications(result.data);
        if (!cancelled) timeout = window.setTimeout(refresh, 15_000);
      };

      timeout = window.setTimeout(refresh, 15_000);

      return () => {
        cancelled = true;
        if (timeout !== undefined) window.clearTimeout(timeout);
      };
    }

    if (!parentId) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:parent:${parentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `parent_id=eq.${parentId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === "DELETE") {
            const deletedId = String(payload.old.id);
            setNotifications((current) => current.filter((notification) => notification.id !== deletedId));
            return;
          }

          const notification = mapNotificationRow(payload.new);
          if (!isVisibleNotification(notification, target, childId)) return;

          setNotifications((current) => {
            const withoutChanged = current.filter((item) => item.id !== notification.id);
            return [notification, ...withoutChanged]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 50);
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [childId, parentId, target]);

  function markRead(ids: string[]) {
    if (ids.length === 0) return;

    const previous = notifications;
    setNotifications((current) =>
      current.map((notification) => (
        ids.includes(notification.id) ? { ...notification, isRead: true } : notification
      )),
    );

    startTransition(async () => {
      const result = await markNotificationsReadAction(ids);
      if (!result.ok) setNotifications(previous);
    });
  }

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>전체 {notifications.length}건</SectionTitle>
        {unreadIds.length > 0 && (
          <button
            type="button"
            onClick={() => markRead(unreadIds)}
            disabled={pending}
            className="rounded-full border border-[var(--monari-line-strong)] bg-white/80 px-4 py-3 text-xs font-medium text-[var(--monari-ink-soft)] transition hover:border-[var(--monari-hero)] hover:text-[var(--monari-hero)] disabled:opacity-50"
          >
            {pending ? "처리 중..." : `모두 읽음 (${unreadIds.length})`}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="monari-card mt-3 px-5 py-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
            <Bell size={26} />
          </span>
          <p className="mt-4 text-[16px] font-extrabold text-[var(--monari-ink)]">새로운 알림이 없어요</p>
          <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">
            {target === "child"
              ? "약속이나 정산 소식이 오면 여기에 바로 보여요."
              : "아이가 요청하거나 약속을 체크하면 여기에 바로 보여요."}
          </p>
        </div>
      ) : (
        <div className="monari-card mt-3 px-4">
          <div className="space-y-3 py-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                target={target}
                onRead={() => {
                  if (!notification.isRead) markRead([notification.id]);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function NotificationCard({
  notification,
  target,
  onRead,
}: {
  notification: AppNotification;
  target: "parent" | "child";
  onRead: () => void;
}) {
  const router = useRouter();
  const linkUrl = getNotificationUrl(notification, target);

  function handleClick() {
    onRead();
    if (linkUrl) router.push(linkUrl);
  }

  const isGoalAchieved = notification.type === "goal_achieved" || notification.type === "goal_achieved_child";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full rounded-[24px] border p-4 text-left transition ${
        isGoalAchieved && !notification.isRead
          ? "border-emerald-300 shadow-[0_4px_16px_rgba(52,211,153,0.18)]"
          : notification.isRead
          ? "border-[var(--monari-line)] bg-[var(--monari-surface-soft)] opacity-75"
          : "border-[var(--monari-line-strong)] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-card)]"
      } ${isGoalAchieved && !notification.isRead ? "bg-gradient-to-br from-emerald-50 to-teal-50" : ""} ${linkUrl ? "active:scale-[0.98] cursor-pointer" : ""}`}
      aria-label={`${notification.title}${notification.isRead ? "" : ", 읽지 않은 알림"}${linkUrl ? ", 탭하여 이동" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span className={`leading-none ${isGoalAchieved ? "text-2xl" : "text-xl"}`}>{TYPE_ICON[notification.type] ?? "🔔"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${notification.isRead ? "text-[var(--color-muted)]" : "text-[var(--color-text)]"}`}>
              {notification.title}
            </p>
            <span className="shrink-0 text-xs text-[var(--color-muted)]">{formatDate(notification.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm leading-5 text-[var(--color-muted)]">{notification.body}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {!notification.isRead && (
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          )}
          {linkUrl && (
            <ChevronRight size={14} className="text-[var(--monari-ink-muted)] opacity-50" />
          )}
        </div>
      </div>
    </button>
  );
}
