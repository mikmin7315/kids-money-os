"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, CheckCircle2, Home, SlidersHorizontal, Settings } from "lucide-react";
import { type ReactNode } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";

const MANAGE_PREFIXES = ["/manage", "/behaviors", "/records"];

const TAB_DEFS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/approvals", label: "승인함", icon: CheckCircle2, showBadge: true },
  { href: "/reports", label: "리포트", icon: BarChart2 },
  { href: "/manage", label: "관리", icon: SlidersHorizontal },
  { href: "/settings", label: "설정", icon: Settings },
];

export function AppNavShell({
  children,
  pendingCount,
}: {
  children: ReactNode;
  pendingCount?: number;
}) {
  const pathname = usePathname();

  return (
    <>
      <main
        className="relative mx-auto w-full max-w-[460px] min-h-dvh"
        style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-1/2 z-50 w-full max-w-[460px] -translate-x-1/2"
        style={{
          background: "var(--monari-tabbar-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid var(--monari-line)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="주요 메뉴"
      >
        <div className="flex">
          {TAB_DEFS.map((tab) => {
            const hasPending = !!(tab.showBadge && pendingCount && pendingCount > 0);
            const active =
              tab.href === "/manage"
                ? MANAGE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
                : tab.href === "/"
                  ? pathname === "/"
                  : pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold transition"
                style={{ color: active ? "var(--monari-hero)" : "var(--monari-ink-muted)" }}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative">
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {hasPending && (
                    <span
                      className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--monari-hero)] px-0.5 text-[9px] font-black text-white"
                      aria-label={`${pendingCount}개 승인 대기`}
                    >
                      {(pendingCount ?? 0) > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

/** 페이지 내 콘텐츠 영역 (히어로 아래, 좌우 패딩 포함) */
export function PageContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-4 ${className}`}>
      {children}
    </div>
  );
}

/** Figma 스타일 full-bleed 블루 히어로 */
export function PageHero({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative overflow-hidden px-5 pt-14 pb-8"
      style={{
        background: "linear-gradient(160deg, #002D6B 0%, #0055B3 50%, #1a75d4 100%)",
      }}
    >
      {/* 배경 글로우 */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-white/[0.05] blur-2xl" />
      {/* 알림 벨 */}
      <div className="absolute top-3 right-4">
        <NotificationBell />
      </div>
      {children}
    </div>
  );
}

/** Figma 스타일 full-bleed 바이올렛 히어로 (아이 테마) */
export function VioletHero({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative overflow-hidden px-5 pt-14 pb-8"
      style={{
        background: "linear-gradient(160deg, #3B1FA8 0%, #6C3FE8 55%, #8B5CF6 100%)",
      }}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/[0.07] blur-3xl" />
      {/* 알림 벨 */}
      <div className="absolute top-3 right-4">
        <NotificationBell />
      </div>
      {children}
    </div>
  );
}
