import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="행동 약속" subtitle="약속 설정">
      <div className="mb-5 h-36 animate-pulse rounded-[24px] bg-[var(--monari-line-strong)]" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="monari-card mb-3 p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-3 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            </div>
            <div className="h-7 w-12 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
          </div>
        </div>
      ))}
    </MobileAppShell>
  );
}
