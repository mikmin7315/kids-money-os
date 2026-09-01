import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";

export default function Loading() {
  return (
    <AppNavShell>
      <PageHero>
        <div className="h-3 w-20 animate-pulse rounded-md bg-white/30 mb-4" />
        <div className="h-7 w-32 animate-pulse rounded-lg bg-white/40 mb-2" />
        <div className="h-4 w-24 animate-pulse rounded-md bg-white/30" />
        <div className="mt-4 h-14 w-full animate-pulse rounded-[12px] bg-white/20" />
      </PageHero>
      <PageContent className="pt-5">
        <div className="monari-card p-4 space-y-4">
          <div className="h-10 w-full animate-pulse rounded-[10px] bg-[var(--monari-line-strong)]" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-[10px] bg-[var(--monari-line-strong)]" />
            ))}
          </div>
          <div className="h-12 w-full animate-pulse rounded-[10px] bg-[var(--monari-line-strong)]" />
        </div>
      </PageContent>
    </AppNavShell>
  );
}
