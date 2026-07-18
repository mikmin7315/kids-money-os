export default function Loading() {
  return (
    <div data-theme="child-mint" className="min-h-screen bg-[#E8FBF5] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="mb-4 rounded-[24px] bg-white/80 p-6 space-y-3 text-center">
        <div className="h-4 w-28 mx-auto animate-pulse rounded-md bg-[#34d399]/20" />
        <div className="h-12 w-24 mx-auto animate-pulse rounded-lg bg-[#059669]/25" />
        <div className="h-3 w-32 mx-auto animate-pulse rounded-md bg-[#34d399]/15" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[18px] bg-white/70 px-4 py-4 flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded-md bg-[#34d399]/25" />
              <div className="h-3 w-20 animate-pulse rounded-md bg-[#34d399]/15" />
            </div>
            <div className="h-5 w-16 animate-pulse rounded-full bg-[#059669]/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
