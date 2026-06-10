import { Bell, Settings } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { countUnreadParentNotificationsAction } from "@/lib/supabase/actions/notifications";

export function AppHeader({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 bg-[linear-gradient(180deg,var(--color-bg)_72%,transparent)] px-4 pb-5 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-md items-center justify-between gap-4">
        <div className="w-full rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/95 px-5 py-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary)]">{eyebrow}</p>
              <h1 className="mt-2 font-display text-[1.5rem] font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1>
            </div>
            {right}
          </div>
        </div>
      </div>
    </header>
  );
}

export async function HeaderActions() {
  const unread = await countUnreadParentNotificationsAction().catch(() => 0);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <HeaderIconLink href="/notifications" label="알림">
          <Bell className="h-4 w-4" />
        </HeaderIconLink>
        {unread > 0 && (
          <span aria-label={`읽지 않은 알림 ${unread}개`} className="pointer-events-none absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--status-danger)] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
      <HeaderIconLink href="/settings" label="설정">
        <Settings className="h-4 w-4" />
      </HeaderIconLink>
    </div>
  );
}

function HeaderIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      aria-label={label}
      href={href}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] transition hover:-translate-y-0.5 hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface)] hover:text-[var(--brand-primary)]"
    >
      {children}
    </Link>
  );
}
