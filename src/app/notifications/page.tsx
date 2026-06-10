import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { getChildModeContext, requireAppConsent, requireParentSession } from "@/lib/auth";
import {
  fetchChildNotificationsAction,
  fetchParentNotificationsAction,
} from "@/lib/supabase/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const [auth, childMode] = await Promise.all([
    requireAppConsent(),
    getChildModeContext(),
  ]);

  const isChildMode = Boolean(childMode.childId);
  if (!isChildMode) await requireParentSession();

  let notifications: Awaited<ReturnType<typeof fetchParentNotificationsAction>>["data"] = [];

  if (isChildMode && childMode.childId) {
    const result = await fetchChildNotificationsAction(childMode.childId);
    notifications = result.data ?? [];
  } else {
    const result = await fetchParentNotificationsAction();
    notifications = result.data ?? [];
  }

  const unreadCount = notifications?.filter((notification) => !notification.isRead).length ?? 0;
  const headline = unreadCount > 0 ? `확인할 알림이 ${unreadCount}건 있어요` : "알림을 모두 확인했어요";

  return (
    <MobileAppShell title={headline} subtitle={isChildMode ? "나에게 온 소식" : "확인할 소식"}>
      <NotificationList
        initialNotifications={notifications ?? []}
        parentId={auth.user?.id ?? null}
        target={isChildMode ? "child" : "parent"}
        childId={isChildMode ? childMode.childId : null}
      />
    </MobileAppShell>
  );
}
