export default function Loading() {
  return (
    <div data-theme="child-mint" className="min-h-dvh bg-[#E8FBF5] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-[#34d399]/25" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-[20px] bg-white/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 animate-pulse rounded-md bg-[#34d399]/25" />
              <div className="h-6 w-14 animate-pulse rounded-full bg-[#34d399]/20" />
            </div>
            <div className="h-3 w-full animate-pulse rounded-md bg-[#34d399]/15" />
            <div className="h-8 w-full animate-pulse rounded-xl bg-[#059669]/15 mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
