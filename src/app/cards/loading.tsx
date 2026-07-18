import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="카드 관리" subtitle="아이 카드">
      <div className="mb-5 h-44 animate-pulse rounded-[24px] bg-[var(--monari-line-strong)]" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="monari-card flex items-center gap-4 p-4">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--monari-line-strong)] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-3 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            </div>
            <div className="h-4 w-4 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
        ))}
      </div>
    </MobileAppShell>
  );
}
