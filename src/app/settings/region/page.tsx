import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { REGIONS } from "@/lib/regions";
import { RegionForm } from "./region-form";

export const dynamic = "force-dynamic";

export default async function RegionPage() {
  const auth = await requireParentSession();
  const currentRegion = (auth.profile as { region?: string | null } | null)?.region ?? null;

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">프로필</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">거주 지역</h1>
        <p className="text-[13px] text-white/65">리포트에서 같은 지역 또래와 비교할 수 있어요</p>
      </PageHero>

      <PageContent className="pt-5">
        <section className="mb-5">
          <SectionTitle>지역 선택</SectionTitle>
          <div className="mt-3">
            <RegionForm currentRegion={currentRegion} regions={REGIONS} />
          </div>
        </section>

        <div className="monari-card p-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--monari-hero-lo)]">
              <MapPin size={16} className="text-[var(--monari-hero)]" />
            </span>
            <div>
              <p className="text-[13px] font-bold text-[var(--monari-ink)] mb-1">개인정보 안내</p>
              <ul className="space-y-1">
                {[
                  "시/도 단위로만 수집됩니다.",
                  "통계 목적으로만 사용되며 개별 식별은 불가해요.",
                  "같은 지역에 최소 5명 이상일 때 동네 비교가 활성화돼요.",
                  "언제든 삭제할 수 있어요.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5 text-[12px] text-[var(--monari-ink-muted)]">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PageContent>
    </AppNavShell>
  );
}
