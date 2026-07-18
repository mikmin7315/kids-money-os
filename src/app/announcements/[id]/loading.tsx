import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="공지 상세" subtitle="공지사항">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="monari-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-12 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
          <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        </div>
        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-[var(--monari-line-strong)]" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          ))}
          <div className="h-3 w-2/3 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        </div>
      </div>
    </MobileAppShell>
  );
}
