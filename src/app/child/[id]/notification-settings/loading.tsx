export default function Loading() {
  return (
    <div data-theme="child-violet" className="min-h-dvh bg-[#F5F0FF] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="rounded-[20px] bg-white/70 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-4 border-b border-[#34d399]/10 last:border-0">
            <div className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded-md bg-[#34d399]/20" />
              <div className="h-3 w-20 animate-pulse rounded-md bg-[#34d399]/15" />
            </div>
            <div className="h-6 w-11 animate-pulse rounded-full bg-[#34d399]/25" />
          </div>
        ))}
      </div>
    </div>
  );
}
