import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNotificationPreferencesAction, toggleParentNotificationAction } from "@/actions/notification-settings";
import { NotificationToggleList } from "@/components/notifications/notification-toggle-list";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";
import { requireParentSession } from "@/lib/auth";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { PushSubscribeButton } from "@/components/notifications/push-subscribe-button";

export const dynamic = "force-dynamic";

export default async function ParentNotificationSettingsPage() {
  const auth = await requireParentSession();
  const parentTypes = NOTIFICATION_TYPES.filter((item) => item.target === "parent");
  const preferences = auth.user
    ? await getNotificationPreferencesAction("parent", auth.user.id)
    : {};

  return (
    <MobileAppShell title="알림 설정" subtitle="설정">
      <div className="px-1 pb-4">
        <Link href="/settings" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
          <ArrowLeft size={16} /> 돌아가기
        </Link>

        <div className="mb-6">
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
            🔔 알림 설정
          </h1>
          <p className="mt-1" style={{ fontSize: 13, color: "var(--monari-ink-muted)" }}>
            받고 싶은 알림 종류를 선택하세요.
          </p>
        </div>

        <PushSubscribeButton />

        <NotificationToggleList
          items={parentTypes.map((item) => ({ type: item.type, label: item.label }))}
          preferences={preferences}
          action={toggleParentNotificationAction}
        />
      </div>
    </MobileAppShell>
  );
}
