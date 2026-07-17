import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="알림" subtitle="확인할 소식">
      <div className="mb-5 h-36 animate-pulse rounded-[24px] bg-[var(--monari-line-strong)]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="monari-card mb-3 flex items-start gap-3 p-4">
          <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-3 w-24 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
        </div>
      ))}
    </MobileAppShell>
  );
}
