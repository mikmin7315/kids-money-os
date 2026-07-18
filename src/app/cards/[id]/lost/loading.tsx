import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="분실 신고" subtitle="아이 카드">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="monari-card p-5 space-y-4 mb-6">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-[var(--monari-line-strong)]" />
        <div className="h-5 w-32 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          ))}
        </div>
      </div>
      <div className="h-13 w-full animate-pulse rounded-[18px] bg-[var(--monari-line-strong)]" />
    </MobileAppShell>
  );
}
