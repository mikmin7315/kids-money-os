"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, House, PiggyBank, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ChildBottomNav({ childId }: { childId: string }) {
  const pathname = usePathname();
  const base = `/child/${childId}`;
  const [hash, setHash] = useState("");

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <nav className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-24px)] max-w-[416px] -translate-x-1/2 rounded-[22px] border border-white/60 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_12px_35px_rgba(23,24,28,0.18)] backdrop-blur-xl" aria-label="아이 메뉴">
      <ul className="grid grid-cols-4">
        {[
          { href: base, label: "홈", icon: House, hash: "" },
          { href: `${base}#today-promises`, label: "약속", icon: CheckCircle2, hash: "#today-promises" },
          { href: `${base}#save-form`, label: "저금", icon: PiggyBank, hash: "#save-form" },
          { href: `${base}#borrow-form`, label: "미리쓰기", icon: WalletCards, hash: "#borrow-form" },
        ].map(({ href, label, icon: Icon, hash: itemHash }) => {
          const active = pathname === base && hash === itemHash;
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-[18px] py-2 text-[10px] font-800 transition active:scale-95 active:bg-[#eeeaff] ${
                  active ? "text-[#5547d7]" : "text-[var(--monari-ink-muted)]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.8 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
