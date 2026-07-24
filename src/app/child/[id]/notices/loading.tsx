export default function Loading() {
  return (
    <div data-theme="child-violet" className="min-h-dvh bg-[#F5F0FF] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-[18px] bg-white/70 px-4 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 animate-pulse rounded-md bg-[#34d399]/25" />
              <div className="h-3 w-12 animate-pulse rounded-md bg-[#34d399]/15" />
            </div>
            <div className="h-3 w-full animate-pulse rounded-md bg-[#34d399]/15" />
            <div className="h-3 w-3/4 animate-pulse rounded-md bg-[#34d399]/15" />
          </div>
        ))}
      </div>
    </div>
  );
}
