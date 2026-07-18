import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="보호자 관리" subtitle="공동 관리자">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="space-y-3 mb-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="monari-card flex items-center gap-4 p-4">
            <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--monari-line-strong)] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-24 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-3 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-13 w-full animate-pulse rounded-[18px] bg-[var(--monari-line-strong)]" />
    </MobileAppShell>
  );
}
