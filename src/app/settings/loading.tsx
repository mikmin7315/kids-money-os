import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="설정" subtitle="계정 관리">
      <div className="mb-5 h-32 animate-pulse rounded-[24px] bg-[var(--monari-line-strong)]" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="monari-card mb-2 flex items-center gap-4 p-4">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--monari-line-strong)]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-28 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
        </div>
      ))}
    </MobileAppShell>
  );
}
