export default function Loading() {
  return (
    <div data-theme="child-violet" className="min-h-dvh bg-[#F5F0FF] px-4 pb-28 pt-5">
      <div className="mb-5 h-7 w-24 animate-pulse rounded-xl bg-[#34d399]/30" />
      <div className="mb-5 rounded-[20px] bg-white/70 p-5 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded-md bg-[#34d399]/20" />
        <div className="h-8 w-28 animate-pulse rounded-lg bg-[#6C3FE8]/20" />
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-3 w-16 animate-pulse rounded-md bg-[#34d399]/20" />
          <div className="h-14 w-full animate-pulse rounded-[14px] bg-white/70" />
        </div>
        <div className="h-14 w-full animate-pulse rounded-[18px] bg-[#6C3FE8]/25 mt-4" />
      </div>
    </div>
  );
}
