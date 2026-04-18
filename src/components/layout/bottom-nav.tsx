import Link from "next/link";
import { BarChart3, ClipboardList, Home, PiggyBank, ShieldCheck } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/records", label: "Records", icon: ClipboardList },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/behaviors", label: "Rules", icon: PiggyBank },
];

export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-24px)] max-w-md -translate-x-1/2 rounded-full border border-[var(--color-border)] bg-[color:rgba(255,255,255,0.92)] p-2 shadow-[0_24px_48px_rgba(48,36,24,0.14)] backdrop-blur">
      <ul className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-full px-2 py-2 text-[11px] font-medium transition ${
                  active ? "bg-[var(--color-text)] text-[var(--color-bg)]" : "text-[var(--color-muted)] hover:bg-[var(--color-card)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
