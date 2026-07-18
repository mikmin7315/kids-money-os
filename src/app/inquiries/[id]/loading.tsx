import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="문의 상세" subtitle="1:1 문의">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="monari-card p-5 space-y-3 mb-4">
        <div className="h-5 w-40 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          ))}
        </div>
        <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      </div>
      <div className="monari-card p-5 space-y-3">
        <div className="h-4 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          ))}
        </div>
      </div>
    </MobileAppShell>
  );
}
