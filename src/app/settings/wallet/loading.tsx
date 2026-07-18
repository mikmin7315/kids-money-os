import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="부모 지갑" subtitle="잔액 및 충전 관리">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="monari-card mb-4 p-5 space-y-3">
        <div className="h-4 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        <div className="h-10 w-36 animate-pulse rounded-lg bg-[var(--monari-line-strong)]" />
        <div className="h-3 w-28 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      </div>
      <div className="monari-card p-5 space-y-4">
        <div className="h-4 w-24 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-14 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-12 w-full animate-pulse rounded-[14px] bg-[var(--monari-line-strong)]" />
          </div>
        ))}
        <div className="h-13 w-full animate-pulse rounded-[18px] bg-[var(--monari-line-strong)]" />
      </div>
    </MobileAppShell>
  );
}
