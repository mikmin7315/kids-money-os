import Link from "next/link";
import { BarChart3, ClipboardList, Home, PiggyBank, ShieldCheck } from "lucide-react";

const items = [
  { href: "/", label: "홈", icon: Home },
  { href: "/records", label: "기록", icon: ClipboardList },
  { href: "/approvals", label: "승인", icon: ShieldCheck },
  { href: "/reports", label: "리포트", icon: BarChart3 },
  { href: "/behaviors", label: "약속", icon: PiggyBank },
];

export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="주요 메뉴" className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-30 w-[calc(100%-24px)] max-w-md -translate-x-1/2 overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-white/95 shadow-[var(--shadow-card)] backdrop-blur-xl">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${
                  active
                    ? "bg-[var(--status-review-bg)] text-[var(--brand-primary)]"
                    : "text-[var(--color-soft)] hover:text-[var(--color-text)]"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.5]"}`} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
