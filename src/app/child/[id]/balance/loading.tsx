export default function Loading() {
  return (
    <div data-theme="child-mint" className="min-h-screen bg-[#E8FBF5] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="mb-4 rounded-[24px] bg-white/80 p-6 space-y-3">
        <div className="h-4 w-20 animate-pulse rounded-md bg-[#34d399]/20" />
        <div className="h-10 w-40 animate-pulse rounded-lg bg-[#059669]/20" />
        <div className="h-3 w-28 animate-pulse rounded-md bg-[#34d399]/15" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[20px] bg-white/70 p-4 space-y-2">
            <div className="h-3 w-16 animate-pulse rounded-md bg-[#34d399]/20" />
            <div className="h-7 w-20 animate-pulse rounded-md bg-[#059669]/20" />
          </div>
        ))}
      </div>
      <div className="rounded-[20px] bg-white/70 p-5 space-y-3">
        <div className="h-4 w-24 animate-pulse rounded-md bg-[#34d399]/20" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-24 animate-pulse rounded-md bg-[#34d399]/15" />
            <div className="h-3 w-14 animate-pulse rounded-md bg-[#34d399]/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
