"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChartNoAxesCombined, ClipboardList, Home, PiggyBank, Settings } from "lucide-react";
import type { ReactNode } from "react";

const TAB_DEFS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/behaviors", label: "약속", icon: PiggyBank, showBadge: true },
  { href: "/records", label: "기록", icon: ClipboardList },
  { href: "/reports", label: "리포트", icon: ChartNoAxesCombined },
  { href: "/settings", label: "설정", icon: Settings },
];

export function MobileAppShell({
  title,
  subtitle,
  pendingCount,
  children,
}: {
  title: string;
  subtitle?: string;
  pendingCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      <main className="monari-shell">
        <header className="monari-header">
          <div className="min-w-0">
            <p className="monari-page-subtitle">{subtitle ?? "Monari"}</p>
            <h1 className="monari-page-title">{title}</h1>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <HeaderLink href="/notifications" label="알림 보기">
              <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
            </HeaderLink>
          </div>
        </header>

        {children}
      </main>

      <nav className="monari-tabbar" aria-label="주요 메뉴">
        {TAB_DEFS.map((tab) => {
          const hasPending = tab.showBadge && pendingCount && pendingCount > 0;
          const href = hasPending ? "/approvals" : tab.href;
          const active = pathname === tab.href || (hasPending && pathname === "/approvals");
          const Icon = tab.icon;
          const badge = hasPending ? pendingCount : null;

          return (
            <Link
              key={tab.href}
              href={href}
              className={`monari-tab ${active ? "monari-tab-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon aria-hidden="true" className="h-[22px] w-[22px]" strokeWidth={active ? 2.5 : 2} />
                {badge !== null && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--monari-hero)] px-0.5 text-[9px] font-black text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function HeaderLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--monari-ink-soft)] transition hover:bg-white hover:text-[var(--monari-hero)]"
      aria-label={label}
    >
      {children}
    </Link>
  );
}
