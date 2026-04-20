"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ChildBottomNav({ childId }: { childId: string }) {
  const pathname = usePathname();
  const base = `/child/${childId}`;
  const isHome = pathname === base;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] z-50 border-t border-[rgba(43,43,43,0.08)] bg-white/95 backdrop-blur-xl">
      <ul className="grid grid-cols-4">
        {[
          { href: base, label: "홈", icon: HomeIcon },
          { href: `${base}#today-promises`, label: "동의함", icon: CheckIcon },
          { href: `${base}#behavior-rules`, label: "약속", icon: StarIcon },
          { href: "/records", label: "정산", icon: ReceiptIcon },
        ].map(({ href, label, icon: Icon }) => {
          const active = label === "홈" ? isHome : false;
          return (
            <li key={label}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-3 text-[11px] font-600 ${
                  active ? "text-[#10367D]" : "text-[rgba(43,43,43,0.45)]"
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        stroke={active ? "#10367D" : "rgba(43,43,43,0.45)"}
        strokeWidth={active ? "2" : "1.5"} fill="none" />
      <path d="M8 20v-6h6v6" stroke={active ? "#10367D" : "rgba(43,43,43,0.45)"}
        strokeWidth={active ? "2" : "1.5"} />
    </svg>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8" stroke={active ? "#10367D" : "rgba(43,43,43,0.45)"}
        strokeWidth={active ? "2" : "1.5"} />
      <path d="M7.5 11l2.5 2.5 4.5-4.5" stroke={active ? "#10367D" : "rgba(43,43,43,0.45)"}
        strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 3l2.09 5.26L19 9.27l-4 3.89.94 5.47L11 16l-4.94 2.63.94-5.47-4-3.89 5.91-.01L11 3z"
        stroke={active ? "#10367D" : "rgba(43,43,43,0.45)"}
        strokeWidth={active ? "2" : "1.5"}
        fill={active ? "#10367D" : "none"} />
    </svg>
  );
}

function ReceiptIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="4" y="2" width="14" height="18" rx="2"
        stroke={active ? "#10367D" : "rgba(43,43,43,0.45)"}
        strokeWidth={active ? "2" : "1.5"} />
      <path d="M8 7h6M8 11h6M8 15h4"
        stroke={active ? "#10367D" : "rgba(43,43,43,0.45)"}
        strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" />
    </svg>
  );
}
