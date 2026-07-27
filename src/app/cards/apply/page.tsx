import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CardApplyForm } from "@/components/cards/card-apply-form";

export const dynamic = "force-dynamic";

export default async function CardApplyPage() {
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data: children } = await supabase
    .from("children")
    .select("id, name")
    .eq("parent_id", auth.user!.id)
    .is("deleted_at", null)
    .order("name");

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/cards" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 카드 관리로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">카드</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">아이 카드 신청</h1>
        <p className="text-[13px] text-white/65">Monari 아이 체크카드</p>
      </PageHero>

      <PageContent className="pt-5">
        {/* 서비스 안내 */}
        <section className="mb-5">
          <SectionTitle>서비스 안내</SectionTitle>
          <div className="mt-3 monari-card px-4 py-4">
            <ul className="space-y-2.5">
              {[
                "아이 통장 잔액 내에서만 결제 가능",
                "부모가 일 / 월 한도를 직접 설정",
                "카드 사용 즉시 부모 알림 발송",
                "언제든 앱에서 즉시 정지 가능",
                "현재 파트너사 연동 준비 중 (곧 출시)",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--monari-hero)] font-bold">✓</span>
                  <span className="text-[13px] text-[var(--monari-ink-soft)]">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 현재 상태 안내 */}
        <div className="mb-5 rounded-[14px] bg-amber-50 border border-amber-200 px-4 py-3.5">
          <p className="text-[12px] font-bold text-amber-800 mb-1">⚠️ 현재 상태 안내</p>
          <p className="text-[12px] text-amber-700">
            카드 서비스는 현재 파트너사 연동 준비 중이에요. 신청 접수는 가능하며, 연동 완료 후 순서대로 발급됩니다.
          </p>
        </div>

        {/* 신청 폼 */}
        <section className="mb-6">
          <SectionTitle>신청하기</SectionTitle>
          {children && children.length > 0 ? (
            <div className="mt-3 monari-card p-4">
              <CardApplyForm childOptions={children} />
            </div>
          ) : (
            <div className="mt-3 monari-card px-5 py-10 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
                <CreditCard size={26} />
              </span>
              <p className="mt-4 text-[14px] font-800 text-[var(--monari-ink)]">아이 계정을 먼저 등록해주세요</p>
              <Link
                href="/children/new"
                className="mt-4 inline-block text-[13px] font-bold text-[var(--monari-hero)]"
              >
                아이 추가하기 →
              </Link>
            </div>
          )}
        </section>
      </PageContent>
    </AppNavShell>
  );
}
