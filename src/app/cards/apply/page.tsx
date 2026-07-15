import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CardApplyForm } from "@/components/cards/card-apply-form";
import Link from "next/link";

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
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="카드" title="아이 카드 신청" />

        <div className="mb-5 rounded-[16px] bg-[var(--monari-hero-lo)] p-5">
          <p style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>💳</p>
          <p className="text-center text-sm font-bold text-[var(--monari-hero)]">Monari 아이 체크카드</p>
          <p className="mt-2 text-center text-xs text-[var(--monari-ink-soft)]">
            아이의 Monari 통장과 연결된 체크카드로<br />실생활 금융 교육을 시작하세요.
          </p>
        </div>

        <section className="mb-5 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">서비스 안내</p>
          <ul className="space-y-2 text-sm text-[var(--color-muted)]">
            {[
              "아이 통장 잔액 내에서만 결제 가능",
              "부모가 일 / 월 한도를 직접 설정",
              "카드 사용 즉시 부모 알림 발송",
              "언제든 앱에서 즉시 정지 가능",
              "현재 파트너사 연동 준비 중 (곧 출시)",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--monari-hero)]">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-5 rounded-[16px] bg-[#fef9c3] p-4">
          <p className="text-xs font-bold text-[#854d0e]">⚠️ 현재 상태 안내</p>
          <p className="mt-1 text-xs text-[#92400e]">
            카드 서비스는 현재 파트너사 연동 준비 중이에요.
            신청 접수는 가능하며, 연동 완료 후 순서대로 발급됩니다.
          </p>
        </section>

        {children && children.length > 0 ? (
          <CardApplyForm childOptions={children} />
        ) : (
          <div className="rounded-[16px] bg-[var(--monari-surface-soft)] px-5 py-10 text-center">
            <p className="text-sm text-[var(--color-muted)]">아이 계정을 먼저 등록해주세요.</p>
            <Link href="/children/new" className="mt-3 inline-block text-sm font-bold text-[var(--color-accent)]">
              아이 추가하기 →
            </Link>
          </div>
        )}

        <div className="mt-4">
          <Link href="/cards" className="text-sm font-bold text-[var(--color-accent)]">← 카드 관리로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
