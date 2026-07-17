import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="돈 리포트" subtitle="이번 달 분석">
      <div className="mb-5 h-36 animate-pulse rounded-[24px] bg-[var(--monari-line-strong)]" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="monari-card h-20 animate-pulse p-4" />
        ))}
      </div>
      <div className="monari-card h-48 animate-pulse" />
    </MobileAppShell>
  );
}
