export default function Loading() {
  return (
    <div data-theme="child-mint" className="min-h-dvh bg-[#E8FBF5] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[20px] bg-white/70 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#34d399]/10">
              <div className="h-3 w-20 animate-pulse rounded-md bg-[#34d399]/20" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between px-4 py-3.5 border-b border-[#34d399]/10 last:border-0">
                <div className="h-4 w-24 animate-pulse rounded-md bg-[#34d399]/20" />
                <div className="h-4 w-10 animate-pulse rounded-md bg-[#34d399]/15" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
