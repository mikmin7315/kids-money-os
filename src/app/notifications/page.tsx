import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { getChildModeContext, requireAppConsent, requireParentSession } from "@/lib/auth";
import {
  fetchChildNotificationsAction,
  fetchParentNotificationsAction,
} from "@/lib/supabase/actions/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

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

  const unreadCount = notifications?.filter((notification) => !notification.isRead).length ?? 0;
  const headline = unreadCount > 0 ? `확인할 알림이 ${unreadCount}건 있어요` : "알림을 모두 확인했어요";

  const totalCount = notifications?.length ?? 0;

  return (
    <MobileAppShell title={headline} subtitle={isChildMode ? "나에게 온 소식" : "확인할 소식"}>
      {/* Hero */}
      <section className="monari-hero mb-6">
        <div className="relative z-10">
          <p className="text-sm font-bold text-white/75">{isChildMode ? "나에게 온 소식" : "부모 알림"}</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white">{headline}</h2>
          <div className="mt-4 flex gap-3">
            <HeroPill label="읽지 않음" value={`${unreadCount}건`} />
            <HeroPill label="전체 알림" value={`${totalCount}건`} />
          </div>
        </div>
      </section>

      <NotificationList
        initialNotifications={notifications ?? []}
        parentId={auth.user?.id ?? null}
        target={isChildMode ? "child" : "parent"}
        childId={isChildMode ? childMode.childId : null}
      />
    </MobileAppShell>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-white/15 px-4 py-2.5 text-center backdrop-blur-sm">
      <p className="text-[11px] font-semibold text-white/70">{label}</p>
      <p className="text-[18px] font-black text-white">{value}</p>
    </div>
  );
}
