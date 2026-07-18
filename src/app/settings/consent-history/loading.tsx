import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="동의 이력" subtitle="약관 동의 기록">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="monari-card p-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-36 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
            </div>
            <div className="h-3 w-24 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
        ))}
      </div>
    </MobileAppShell>
  );
}
