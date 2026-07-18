import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="한도 설정" subtitle="아이 카드">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="monari-card p-5 space-y-4 mb-4">
        <div className="h-4 w-24 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-13 w-full animate-pulse rounded-[14px] bg-[var(--monari-line-strong)]" />
          </div>
        ))}
      </div>
      <div className="h-13 w-full animate-pulse rounded-[18px] bg-[var(--monari-line-strong)]" />
    </MobileAppShell>
  );
}
