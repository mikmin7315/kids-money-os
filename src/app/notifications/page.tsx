import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Section, Surface } from "@/components/ui/primitives";
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

  const eyebrow = isChildMode ? "아이" : "부모";

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow={eyebrow} title="알림" />

        <Section
          title={`전체 ${notifications?.length ?? 0}건`}
          description={isChildMode ? "나에게 온 알림" : "부모 알림함"}
        >
          {!notifications || notifications.length === 0 ? (
            <Surface>
              <p className="text-sm text-[var(--color-muted)]">새로운 알림이 없습니다.</p>
            </Surface>
          ) : (
            <NotificationList notifications={notifications} />
          )}
        </Section>
      </MobileShell>
    </PageContainer>
  );
}
