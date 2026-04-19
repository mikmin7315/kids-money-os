import { AppHeader } from "@/components/layout/app-header";
import { EmptyState, MobileShell, PageContainer, PageHero, Section } from "@/components/ui/primitives";
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

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow={isChildMode ? "아이" : "부모"} title="알림" />

        <PageHero
          eyebrow={isChildMode ? "나에게 온 소식" : "확인할 소식"}
          title={
            notifications && notifications.length > 0 ? (
              <>{notifications.length}건의<br />새 소식이 있어요</>
            ) : (
              <>새로운 소식이<br />없어요</>
            )
          }
          description={
            isChildMode
              ? "약속 확인 결과나 정산 소식이 여기 도착해요."
              : "아이의 약속 요청, 미리쓰기 요청, 정산 소식을 모아뒀어요."
          }
        />

        <Section title={`전체 ${notifications?.length ?? 0}건`}>
          {!notifications || notifications.length === 0 ? (
            <EmptyState
              message="새로운 알림이 없어요."
              hint={isChildMode ? "약속이나 정산 소식이 오면 여기에 보여요." : "아이가 요청하거나 약속을 체크하면 알림이 와요."}
            />
          ) : (
            <NotificationList notifications={notifications} />
          )}
        </Section>
      </MobileShell>
    </PageContainer>
  );
}
