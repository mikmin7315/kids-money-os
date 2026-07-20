export default function Loading() {
  return (
    <div data-theme="child-mint" className="min-h-dvh bg-[#E8FBF5] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 animate-pulse rounded-md bg-[#34d399]/20" />
            <div className="h-14 w-full animate-pulse rounded-[14px] bg-white/70" />
          </div>
        ))}
        <div className="h-14 w-full animate-pulse rounded-[18px] bg-[#059669]/25 mt-6" />
      </div>
    </div>
  );
}
