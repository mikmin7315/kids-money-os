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
    <header className="sticky top-0 z-20 -mx-4 border-b border-[var(--color-border)] bg-white/90 px-4 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">{eyebrow}</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
        </div>
        {right}
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      {children}
    </Link>
  );
}
