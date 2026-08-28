"use client";

import { House, ScrollText, Target, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "목표", icon: Target,      emoji: "🎯" },
  { label: "홈",   icon: House,       emoji: "🏠" },
  { label: "기록", icon: ScrollText,  emoji: "📝" },
  { label: "나",   icon: UserCircle,  emoji: "🙋" },
];

export function ChildBottomNav({ childId }: { childId: string }) {
  const pathname = usePathname();
  const base = `/child/${childId}`;

  const hrefs = [`${base}/goal`, base, `${base}/records`, `${base}/settings`];

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-[460px] -translate-x-1/2 border-t border-[rgba(14,165,233,0.12)] bg-white/96 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="아이 메뉴"
    >
      <ul className="grid grid-cols-4">
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
                    background: active ? "linear-gradient(145deg, #0EA5E9, #38BDF8)" : "transparent",
                    boxShadow: active ? "0 6px 16px rgba(14,165,233,0.40)" : "none",
                  }}
                >
                  {active ? (
                    <span style={{ fontSize: 22 }}>{emoji}</span>
                  ) : (
                    <Icon style={{ width: 24, height: 24, color: "#60A5FA" }} strokeWidth={2} />
                  )}
                </span>
                {/* 레이블 */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 800 : 600,
                    color: active ? "#0EA5E9" : "#8B7FA8",
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
