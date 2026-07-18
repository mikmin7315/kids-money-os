import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="아이 정보 수정" subtitle="설정">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            <div className="h-13 w-full animate-pulse rounded-[14px] bg-[var(--monari-line-strong)]" />
          </div>
        ))}
        <div className="h-13 w-full animate-pulse rounded-[18px] bg-[var(--monari-line-strong)] mt-2" />
      </div>
    </MobileAppShell>
  );
}
