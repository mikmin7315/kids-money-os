import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="카드 신청" subtitle="아이 카드">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-14 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-13 w-full animate-pulse rounded-[14px] bg-[var(--monari-line-strong)]" />
          </div>
        ))}
        <div className="h-13 w-full animate-pulse rounded-[18px] bg-[var(--monari-line-strong)] mt-2" />
      </div>
    </MobileAppShell>
  );
}
