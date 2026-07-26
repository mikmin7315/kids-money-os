import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";

export default function Loading() {
  return (
    <AppNavShell>
      <PageHero>
        <div className="h-3 w-20 animate-pulse rounded-md bg-white/30 mb-3" />
        <div className="h-7 w-40 animate-pulse rounded-lg bg-white/40" />
      </PageHero>
      <PageContent className="pt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="monari-card mb-2 flex items-center gap-4 p-4">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--monari-line-strong)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
              <div className="h-3 w-20 animate-pulse rounded-md bg-[var(--monari-line-strong)]" />
            </div>
          </div>
        ))}
      </PageContent>
    </AppNavShell>
  );
}