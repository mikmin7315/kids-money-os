import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="알림 설정" subtitle="알림 관리">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="monari-card overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-[var(--monari-line)] last:border-0">
            <div className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            </div>
            <div className="h-6 w-11 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
          </div>
        ))}
      </div>
    </MobileAppShell>
  );
}
