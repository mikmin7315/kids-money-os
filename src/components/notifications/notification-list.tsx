"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  behavior_approved: "✅",
  behavior_rejected: "❌",
  borrow_requested: "💸",
  borrow_approved: "✅",
  borrow_rejected: "❌",
  monthly_settlement: "📊",
};

type NotificationListProps = {
  initialNotifications: AppNotification[];
  parentId: string | null;
  target: "parent" | "child";
  childId: string | null;
};

function formatDate(iso: string) {
  const date = new Date(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
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
            className="rounded-full border border-[var(--color-border)] bg-white/80 px-4 py-2 text-xs font-medium text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
          >
            {pending ? "처리 중..." : `모두 읽음 (${unreadIds.length})`}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="monari-card mt-3 px-4 py-5 text-center">
          <p className="text-[14px] font-600 text-[var(--monari-ink-muted)]">새로운 알림이 없어요</p>
          <p className="monari-meta mt-1">
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
  onRead,
}: {
  notification: AppNotification;
  onRead: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRead}
      className={`w-full rounded-[24px] border p-4 text-left transition ${
        notification.isRead
          ? "border-[var(--monari-line)] bg-[var(--monari-surface-soft)] opacity-75"
          : "border-[var(--monari-line-strong)] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-card)]"
      }`}
      aria-label={`${notification.title}${notification.isRead ? "" : ", 읽지 않은 알림"}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none">{TYPE_ICON[notification.type] ?? "🔔"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold ${notification.isRead ? "text-[var(--color-muted)]" : "text-[var(--color-text)]"}`}>
              {notification.title}
            </p>
            <span className="shrink-0 text-xs text-[var(--color-muted)]">{formatDate(notification.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm leading-5 text-[var(--color-muted)]">{notification.body}</p>
        </div>
        {!notification.isRead && (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
        )}
      </div>
    </button>
  );
}
