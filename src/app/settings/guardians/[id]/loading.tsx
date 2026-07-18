import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="보호자 상세" subtitle="설정">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="monari-card p-5 space-y-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
          <div className="space-y-1.5">
            <div className="h-5 w-24 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-3 w-32 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
        ))}
      </div>
    </MobileAppShell>
  );
}
