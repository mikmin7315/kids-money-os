"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Home, Moon, Settings, SlidersHorizontal, Sun } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { type ReactNode, useEffect, useState } from "react";

const MANAGE_PREFIXES = ["/manage", "/behaviors", "/records", "/reports"];

const TAB_DEFS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/approvals", label: "승인함", icon: CheckCircle2, showBadge: true },
  { href: "/manage", label: "관리", icon: SlidersHorizontal },
  { href: "/settings", label: "설정", icon: Settings },
];

function getInitialTheme() {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("monari-theme");
  return stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}

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
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {children}
      </main>

      <nav className="monari-tabbar" aria-label="주요 메뉴">
        {TAB_DEFS.map((tab) => {
          const hasPending = tab.showBadge && pendingCount && pendingCount > 0;
          const href = tab.href;
          const active =
            tab.href === "/manage"
              ? MANAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
              : pathname === tab.href;
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

function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("monari-theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--monari-ink-soft)] transition hover:bg-white hover:text-[var(--monari-hero)]"
    >
      {isDark ? <Sun aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} /> : <Moon aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />}
    </button>
  );
}
