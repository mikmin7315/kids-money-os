export default function GoalLoading() {
  return (
    <div style={{ background: "#E0F2FE", minHeight: "100dvh" }}>
      <main className="px-4 pb-36 pt-8">
        <div className="mb-7">
          <div className="h-4 w-16 animate-pulse rounded-full bg-[#B3E0F7] mb-2" />
          <div className="h-8 w-32 animate-pulse rounded-xl bg-[#B3E0F7]" />
        </div>
        <div className="h-64 animate-pulse rounded-[28px] bg-white/60" />
      </main>
    </div>
  );
}
