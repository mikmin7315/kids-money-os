"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { countUnreadParentNotificationsAction } from "@/lib/supabase/actions/notifications";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    countUnreadParentNotificationsAction()
      .then(setUnread)
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `알림 ${unread}건 미읽음` : "알림 보기"}
      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--monari-surface-soft)] text-[var(--monari-ink-soft)] transition hover:bg-[var(--monari-hero-lo)] hover:text-[var(--monari-hero)] active:scale-90"
    >
      <Bell aria-hidden="true" className="h-5 w-5" strokeWidth={2.25} />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--monari-hero)] px-1 text-[9px] font-black text-white shadow-[0_1px_4px_rgba(124,58,237,0.45)]"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
