import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNotificationPreferencesAction, toggleParentNotificationAction } from "@/actions/notification-settings";
import { NotificationToggleList } from "@/components/notifications/notification-toggle-list";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";
import { requireParentSession } from "@/lib/auth";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { PushSubscribeButton } from "@/components/notifications/push-subscribe-button";

export const dynamic = "force-dynamic";

export default async function ParentNotificationSettingsPage() {
  const auth = await requireParentSession();
  const parentTypes = NOTIFICATION_TYPES.filter((item) => item.target === "parent");
  const preferences = auth.user
    ? await getNotificationPreferencesAction("parent", auth.user.id)
    : {};

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">앱 설정</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">알림 설정</h1>
        <p className="text-[13px] text-white/65">받고 싶은 알림 종류를 선택하세요</p>
      </PageHero>
      <PageContent className="pt-5">
        <div className="mb-4">
          <PushSubscribeButton />
        </div>
        <NotificationToggleList
          items={parentTypes.map((item) => ({ type: item.type, label: item.label }))}
          preferences={preferences}
          action={toggleParentNotificationAction}
        />
      </PageContent>
    </AppNavShell>
  );
}
