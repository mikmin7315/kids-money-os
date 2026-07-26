import { getChildModeContext, requireAppConsent, requireParentSession } from "@/lib/auth";
import {
  fetchChildNotificationsAction,
  fetchParentNotificationsAction,
} from "@/lib/supabase/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";

export const dynamic = "force-dynamic";

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

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const totalCount = notifications?.length ?? 0;
  const headline = unreadCount > 0 ? `알림 ${unreadCount}건 미확인` : "모든 알림 확인 완료";

  return (
    <AppNavShell>
      <PageHero>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">
          {isChildMode ? "나에게 온 소식" : "부모 알림"}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-4">{headline}</h1>
        <div className="grid grid-cols-2 gap-2">
          <HeroPill label="읽지 않음" value={`${unreadCount}건`} />
          <HeroPill label="전체 알림" value={`${totalCount}건`} />
        </div>
      </PageHero>
      <PageContent className="pt-4">
        <NotificationList
          initialNotifications={notifications ?? []}
          parentId={auth.user?.id ?? null}
          target={isChildMode ? "child" : "parent"}
          childId={isChildMode ? childMode.childId : null}
        />
      </PageContent>
    </AppNavShell>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/15 bg-white/10 px-4 py-2.5 text-center">
      <p className="text-[11px] font-semibold text-white/70">{label}</p>
      <p className="text-[18px] font-black text-white">{value}</p>
    </div>
  );
}
