"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ChildBottomNav({ childId }: { childId: string }) {
  const pathname = usePathname();
  const base = `/child/${childId}`;
  const isHome = pathname === base;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 border-t border-white/15 bg-[#251b78]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(28,27,58,0.18)] backdrop-blur-xl" aria-label="아이 메뉴">
      <ul className="grid grid-cols-4">
        {[
          { href: base, label: "홈", icon: HomeIcon },
          { href: `${base}#today-promises`, label: "약속 체크", icon: CheckIcon },
          { href: `${base}#save-form`, label: "저금통", icon: StarIcon },
          { href: "/records", label: "정산", icon: ReceiptIcon },
        ].map(({ href, label, icon: Icon }) => {
          const active = label === "홈" ? isHome : false;
          return (
            <li key={label}>
              <Link
                href={href}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 py-2 text-[10px] font-700 ${
                  active ? "text-white" : "text-white/55"
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
        stroke="currentColor"
        strokeWidth={active ? "2" : "1.5"} fill="none" />
      <path d="M8 20v-6h6v6" stroke="currentColor"
        strokeWidth={active ? "2" : "1.5"} />
    </svg>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor"
        strokeWidth={active ? "2" : "1.5"} />
      <path d="M7.5 11l2.5 2.5 4.5-4.5" stroke="currentColor"
        strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 3l2.09 5.26L19 9.27l-4 3.89.94 5.47L11 16l-4.94 2.63.94-5.47-4-3.89 5.91-.01L11 3z"
        stroke="currentColor"
        strokeWidth={active ? "2" : "1.5"}
        fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function ReceiptIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="4" y="2" width="14" height="18" rx="2"
        stroke="currentColor"
        strokeWidth={active ? "2" : "1.5"} />
      <path d="M8 7h6M8 11h6M8 15h4"
        stroke="currentColor"
        strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" />
    </svg>
  );
}
