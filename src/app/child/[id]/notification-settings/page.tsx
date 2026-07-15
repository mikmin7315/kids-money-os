import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNotificationPreferencesAction, toggleChildNotificationAction } from "@/actions/notification-settings";
import { NotificationToggleList } from "@/components/notifications/notification-toggle-list";
import { NotificationPermissionBanner } from "@/components/notifications/notification-permission-banner";
import { NOTIFICATION_TYPES } from "@/lib/notification-types";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ChildNotificationSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([getChildModeContext(), getAppDataBundle()]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  const childTypes = NOTIFICATION_TYPES.filter((item) => item.target === "child");
  const preferences = await getNotificationPreferencesAction("child", id);

  return (
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}/settings`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#7c3aed]">
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      <div className="mb-6">
        <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>{child.name}</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1a0533", letterSpacing: "-0.03em" }}>
          🔔 알림 설정
        </h1>
      </div>

      <NotificationPermissionBanner />

      <NotificationToggleList
        items={childTypes.map((item) => ({ type: item.type, label: item.label }))}
        preferences={preferences}
        action={toggleChildNotificationAction}
      />
    </main>
  );
}
