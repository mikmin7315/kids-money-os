"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChartNoAxesCombined, CheckCheck, ClipboardList, Home, PiggyBank, Settings } from "lucide-react";
import type { ReactNode } from "react";

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/approvals", label: "승인", icon: CheckCheck },
  { href: "/behaviors", label: "약속", icon: PiggyBank },
  { href: "/records", label: "기록", icon: ClipboardList },
  { href: "/reports", label: "리포트", icon: ChartNoAxesCombined },
];

export function MobileAppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
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
            <HeaderLink href="/settings" label="설정 보기">
              <Settings aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
            </HeaderLink>
          </div>
        </header>

        {children}
      </main>

      <nav className="monari-tabbar" aria-label="주요 메뉴">
        {tabs.map((tab) => {
          const active = pathname === tab.href;

          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`monari-tab ${active ? "monari-tab-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
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
