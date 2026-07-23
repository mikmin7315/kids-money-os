"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, CheckCircle2, Home, Moon, Settings, SlidersHorizontal, Sun } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { type ReactNode, useEffect, useState } from "react";

const MANAGE_PREFIXES = ["/manage", "/behaviors", "/records"];

const TAB_DEFS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/approvals", label: "승인함", icon: CheckCircle2, showBadge: true },
  { href: "/reports", label: "리포트", icon: BarChart2 },
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
              : tab.href === "/"
                ? pathname === "/"
                : pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          const badge = hasPending ? pendingCount : null;

          return (
            <Link
              key={tab.href}
              href={href}
              className={`monari-tab ${active ? "monari-tab-active" : ""}`}
              aria-current={active ? "page" : undefined}
              aria-label={badge ? `${tab.label} (대기 ${badge}건)` : tab.label}
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
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("monari-theme");
    const initial = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(initial);
    setMounted(true);
    document.documentElement.setAttribute("data-theme", initial ? "dark" : "light");
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("monari-theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  // SSR과 첫 클라이언트 렌더 일치: 마운트 전에는 빈 버튼 placeholder
  if (!mounted) {
    return <span className="flex h-11 w-11 items-center justify-center" aria-hidden />;
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
