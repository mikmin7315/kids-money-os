export default function Loading() {
  return (
    <>
      <main className="monari-shell" aria-busy="true" aria-label="화면을 불러오는 중" role="status">
        <header className="monari-header">
          <div className="min-w-0 flex-1">
            <div className="h-3 w-24 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
            <div className="mt-2 h-7 w-40 animate-pulse rounded-lg bg-[var(--monari-line-strong)]" />
          </div>
          <div className="flex gap-1">
            <div className="h-11 w-11 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
            <div className="h-11 w-11 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
          </div>
        </header>

        <div className="mb-5 h-52 animate-pulse rounded-[24px] bg-[var(--monari-line-strong)]" />

        <div className="monari-card mb-5 p-5">
          <div className="h-5 w-28 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
          <div className="mt-5 grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="mx-auto h-3 w-12 animate-pulse rounded-full bg-[var(--monari-line-strong)]" />
                <div className="mx-auto h-5 w-16 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              </div>
            ))}
          </div>
        </div>

        <div className="monari-card grid grid-cols-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse border border-[var(--monari-line)] bg-[var(--monari-line-strong)]" />
          ))}
        </div>
      </main>

      <nav className="monari-tabbar" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-9 w-9 animate-pulse rounded-xl bg-[var(--monari-line-strong)]" />
        ))}
      </nav>
    </>
  );
}
