"use client";

import { CheckCircle2, House, PiggyBank, Settings, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "홈",     icon: House,         emoji: "🏠" },
  { label: "약속",   icon: CheckCircle2,  emoji: "✅" },
  { label: "저금",   icon: PiggyBank,     emoji: "🐷" },
  { label: "미리쓰기", icon: WalletCards, emoji: "🛒" },
  { label: "설정",   icon: Settings,      emoji: "⚙️" },
];

export function ChildBottomNav({ childId }: { childId: string }) {
  const pathname = usePathname();
  const base = `/child/${childId}`;

  const hrefs = [base, `${base}/promise`, `${base}/save`, `${base}/borrow`, `${base}/settings`];

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[460px] -translate-x-1/2 border-t border-[rgba(124,58,237,0.10)] bg-white/96 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="아이 메뉴"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ label, icon: Icon, emoji }, i) => {
          const href = hrefs[i];
          const active = pathname === href;
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-1.5 py-3 transition-all active:scale-90"
                style={{ minHeight: 72 }}
              >
                {/* 아이콘 배경 */}
                <span
                  className="flex items-center justify-center rounded-[16px] transition-all"
                  style={{
                    width: 44,
                    height: 44,
                    background: active ? "linear-gradient(145deg, #7c3aed, #a855f7)" : "transparent",
                    boxShadow: active ? "0 6px 16px rgba(124,58,237,0.35)" : "none",
                  }}
                >
                  {active ? (
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                  ) : (
                    <Icon style={{ width: 24, height: 24, color: "#c4b5fd" }} strokeWidth={2} />
                  )}
                </span>
                {/* 레이블 */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 800 : 600,
                    color: active ? "var(--monari-hero)" : "var(--monari-ink-muted)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
