export default function Loading() {
  return (
    <div data-theme="child-violet" className="min-h-dvh bg-[#E0F2FE] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-16 animate-pulse rounded-full bg-[#34d399]/25" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-[14px] bg-white/60 px-4 py-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-[#34d399]/30 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-24 animate-pulse rounded-md bg-[#34d399]/25" />
              <div className="h-3 w-14 animate-pulse rounded-md bg-[#34d399]/20" />
            </div>
            <div className="h-4 w-12 animate-pulse rounded-md bg-[#34d399]/25" />
          </div>
        ))}
      </div>
    </div>
  );
}
