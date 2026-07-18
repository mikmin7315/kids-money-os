import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="공지사항" subtitle="알림">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="monari-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-5 w-12 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
            </div>
            <div className="h-3 w-full animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-3 w-3/4 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
        ))}
      </div>
    </MobileAppShell>
  );
}
