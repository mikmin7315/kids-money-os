import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="아이 프로필 선택" subtitle="아이 모드">
      <div className="mb-4 h-32 animate-pulse rounded-[24px] bg-[var(--monari-line-strong)]" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-[20px] bg-[var(--monari-surface)] p-4 shadow-[var(--monari-shadow-card)]">
            <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-3 w-32 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            </div>
            <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
          </div>
        ))}
      </div>
    </MobileAppShell>
  );
}
