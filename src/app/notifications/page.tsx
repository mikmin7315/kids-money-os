import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession, getChildModeContext } from "@/lib/auth";
import { fetchParentNotificationsAction, fetchChildNotificationsAction } from "@/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

export default async function NotificationsPage() {
  const [auth, childMode] = await Promise.all([
    requireParentSession().catch(() => null),
    getChildModeContext(),
  ]);

  const isChildMode = !!childMode.childId && !auth?.user;

  let notifications: Awaited<ReturnType<typeof fetchParentNotificationsAction>>["data"] = [];

  if (isChildMode && childMode.childId) {
    const result = await fetchChildNotificationsAction(childMode.childId);
    notifications = result.data ?? [];
  } else {
    const result = await fetchParentNotificationsAction();
    notifications = result.data ?? [];
  }

  const count = notifications?.length ?? 0;
  const headline = count > 0 ? `${count}건의 새 소식이 있어요` : "새로운 소식이 없어요";

  return (
    <MobileAppShell title={headline} subtitle={isChildMode ? "나에게 온 소식" : "확인할 소식"}>
      <section className="mb-4">
        <SectionTitle>전체 {count}건</SectionTitle>
        {count === 0 ? (
          <div className="monari-card mt-3 px-4 py-5 text-center">
            <p className="text-[14px] font-600 text-[var(--monari-ink-muted)]">새로운 알림이 없어요</p>
            <p className="monari-meta mt-1">
              {isChildMode ? "약속이나 정산 소식이 오면 여기에 보여요." : "아이가 요청하거나 약속을 체크하면 알림이 와요."}
            </p>
          </div>
        ) : (
          <div className="monari-card mt-3 px-4">
            <NotificationList notifications={notifications!} />
          </div>
        )}
      </section>
    </MobileAppShell>
  );
}
