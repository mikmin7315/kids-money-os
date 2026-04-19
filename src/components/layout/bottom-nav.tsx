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
    <nav className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-32px)] max-w-md -translate-x-1/2 overflow-hidden rounded-[34px] border border-[rgba(74,54,24,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(241,229,210,0.98))] shadow-[var(--shadow-card)] backdrop-blur-xl">
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 py-4 text-[10px] font-semibold transition ${
                  active
                    ? "bg-[rgba(10,127,115,0.12)] text-[var(--color-accent)]"
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
