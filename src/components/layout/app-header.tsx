import { Bell, Settings } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { countUnreadParentNotificationsAction } from "@/actions/notifications";

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
    <header className="sticky top-0 z-20 -mx-4 px-4 pb-5">
      <div className="mx-auto flex max-w-md items-center justify-between gap-4">
        <div className="w-full rounded-[32px] border border-[rgba(74,54,24,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(245,232,211,0.96))] px-5 py-4 shadow-[var(--shadow-card)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">{eyebrow}</p>
              <h1 className="mt-2 font-display text-[1.5rem] font-semibold tracking-tight text-[var(--color-text)]">{title}</h1>
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
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
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
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(74,54,24,0.16)] bg-white/82 text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:bg-white hover:text-[var(--color-accent)]"
    >
      {children}
    </Link>
  );
}
