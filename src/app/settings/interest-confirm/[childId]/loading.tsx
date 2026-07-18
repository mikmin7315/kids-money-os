import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="이자율 확정" subtitle="월 정산">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="monari-card p-6 space-y-4 mb-4">
        <div className="h-4 w-28 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        <div className="h-12 w-32 animate-pulse rounded-lg bg-[var(--monari-line-strong)]" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 w-24 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-3 w-12 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-13 w-full animate-pulse rounded-[18px] bg-[var(--monari-line-strong)]" />
    </MobileAppShell>
  );
}
