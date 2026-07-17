import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="승인함" subtitle="확인할 내용">
      <div className="mb-5 h-36 animate-pulse rounded-[24px] bg-[var(--monari-line-strong)]" />
      <div className="mb-3 h-5 w-24 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="monari-card mb-3 flex items-center gap-4 p-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded-xl bg-[var(--monari-line-strong)]" />
        </div>
      ))}
    </MobileAppShell>
  );
}
