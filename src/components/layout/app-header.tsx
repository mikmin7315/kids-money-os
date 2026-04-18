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
    <header className="sticky top-0 z-20 -mx-4 border-b border-[var(--color-border)] bg-[color:rgba(248,244,238,0.88)] px-4 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-md items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-soft)]">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
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
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text)] transition hover:bg-[var(--color-card)]"
    >
      {children}
    </Link>
  );
}
