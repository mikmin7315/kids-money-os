import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="고객 문의" subtitle="1:1 문의">
      <div className="space-y-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="monari-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
            </div>
            <div className="h-3 w-full animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-3 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        <div className="h-13 w-full animate-pulse rounded-[14px] bg-[var(--monari-line-strong)]" />
        <div className="h-24 w-full animate-pulse rounded-[14px] bg-[var(--monari-line-strong)]" />
        <div className="h-13 w-full animate-pulse rounded-[18px] bg-[var(--monari-line-strong)]" />
      </div>
    </MobileAppShell>
  );
}
