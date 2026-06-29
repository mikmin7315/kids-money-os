import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNotificationPreferencesAction, toggleParentNotificationAction } from "@/actions/notification-settings";
import { NotificationToggleList } from "@/components/notifications/notification-toggle-list";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";
import { requireParentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ParentNotificationSettingsPage() {
  const auth = await requireParentSession();
  const parentTypes = NOTIFICATION_TYPES.filter((item) => item.target === "parent");
  const preferences = auth.user
    ? await getNotificationPreferencesAction("parent", auth.user.id)
    : {};

  return (
    <main className="px-4 pb-36 pt-8">
      <Link href="/settings" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#7c3aed]">
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      <div className="mb-6">
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1a0533", letterSpacing: "-0.03em" }}>
          🔔 알림 설정
        </h1>
        <p className="mt-1" style={{ fontSize: 13, color: "#9ca3af" }}>
          받고 싶은 알림 종류를 선택하세요.
        </p>
      </div>

      <NotificationToggleList
        items={parentTypes.map((item) => ({ type: item.type, label: item.label }))}
        preferences={preferences}
        action={toggleParentNotificationAction}
      />
    </main>
  );
}
