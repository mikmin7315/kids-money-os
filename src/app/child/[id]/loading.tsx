export default function Loading() {
  return (
    <div data-theme="child-violet" style={{ background: "#F5F0FF", minHeight: "100dvh" }}>
      {/* 히어로 */}
      <div className="animate-pulse px-4 pb-4 pt-10" style={{ background: "linear-gradient(160deg,#3B0764,#6C3FE8)" }}>
        <div className="mb-2 h-3 w-20 rounded-full bg-white/30" />
        <div className="mb-4 h-8 w-32 rounded-lg bg-white/30" />
        <div className="flex gap-3">
          <div className="h-20 flex-1 rounded-[18px] bg-white/20" />
          <div className="h-20 flex-1 rounded-[18px] bg-white/20" />
        </div>
      </div>

      <div className="px-4 pt-5 space-y-4">
        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[16px] bg-[var(--monari-line-strong)]" />
          ))}
        </div>
        {/* 카드들 */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-[20px] bg-[var(--monari-line-strong)]" />
        ))}
        {/* 최근 내역 */}
        <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-3 w-14 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            </div>
            <div className="h-4 w-12 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
