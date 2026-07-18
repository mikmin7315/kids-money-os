import { MobileAppShell } from "@/components/monari/mobile-app-shell";

export default function Loading() {
  return (
    <MobileAppShell title="이자율 설정" subtitle="아이별 이자율">
      <div className="mb-4 h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="monari-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--monari-line-strong)] shrink-0" />
              <div className="h-5 w-24 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-16 animate-pulse rounded-[14px] bg-[var(--monari-line-strong)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </MobileAppShell>
  );
}
