"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const tabs = [
  { href: "/", label: "홈" },
  { href: "/approvals", label: "승인" },
  { href: "/behaviors", label: "약속" },
  { href: "/records", label: "기록" },
  { href: "/reports", label: "리포트" },
  { href: "/child-mode", label: "아이" },
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
          <div>
            <p className="monari-page-subtitle">{subtitle ?? "Monari"}</p>
            <h1 className="monari-page-title">{title}</h1>
          </div>

          <Link
            href="/notifications"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[rgba(43,43,43,0.08)] bg-white shadow-[0_8px_24px_rgba(43,43,43,0.04)]"
            aria-label="알림 보기"
          >
            <span className="text-[15px] font-bold text-[#10367D]">M</span>
          </Link>
        </header>

        {children}
      </main>

      <nav className="monari-tabbar" aria-label="주요 메뉴">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href === "/child-mode" && pathname.startsWith("/child/"));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`monari-tab ${active ? "monari-tab-active" : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
