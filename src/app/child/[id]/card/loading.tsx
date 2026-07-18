export default function Loading() {
  return (
    <div data-theme="child-mint" className="min-h-screen bg-[#E8FBF5] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="mb-6 h-44 animate-pulse rounded-[24px] bg-gradient-to-br from-[#059669]/30 to-[#34d399]/20" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-[16px] bg-white/70 px-4 py-4">
            <div className="h-4 w-28 animate-pulse rounded-md bg-[#34d399]/25" />
            <div className="h-4 w-16 animate-pulse rounded-md bg-[#34d399]/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
