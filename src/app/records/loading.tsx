import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="돈 기록" subtitle="수입·지출 내역">
      <div className="mb-5 h-36 animate-pulse rounded-[24px] bg-[var(--monari-line-strong)]" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-[var(--monari-line)] py-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
          <div className="h-5 w-14 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
        </div>
      ))}
    </MobileAppShell>
  );
}
