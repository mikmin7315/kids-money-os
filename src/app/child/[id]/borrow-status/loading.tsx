export default function Loading() {
  return (
    <div data-theme="child-mint" className="min-h-dvh bg-[#E8FBF5] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[20px] bg-white/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 animate-pulse rounded-md bg-[#34d399]/25" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-[#34d399]/20" />
            </div>
            <div className="h-2 w-full animate-pulse rounded-full bg-[#34d399]/15" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-12 animate-pulse rounded-[12px] bg-[#34d399]/15" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
