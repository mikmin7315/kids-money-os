import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CardLimitsForm } from "@/components/cards/card-limits-form";

export const dynamic = "force-dynamic";

export default async function CardLimitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data: card } = await supabase
    .from("child_cards")
    .select("id, daily_limit, monthly_limit, child_id, children(name)")
    .eq("id", id)
    .eq("parent_id", auth.user!.id)
    .maybeSingle();

  if (!card) notFound();
  const child = Array.isArray(card.children) ? card.children[0] : card.children;

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="카드" title={`${String(child?.name ?? "")} 한도 설정`} />

        <div className="mb-5 rounded-[16px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <CardLimitsForm
            cardId={card.id}
            dailyLimit={Number(card.daily_limit)}
            monthlyLimit={Number(card.monthly_limit)}
          />
        </div>

        <div className="rounded-[16px] bg-[var(--monari-surface-soft)] p-4 text-xs text-[var(--color-muted)]">
          <p>• 일 한도는 월 한도를 초과할 수 없어요.</p>
          <p>• 한도 변경은 즉시 적용됩니다.</p>
          <p>• 잔액 부족 시 결제가 거절돼요.</p>
        </div>

        <div className="mt-4">
          <Link href="/cards" className="text-sm font-bold text-[var(--color-accent)]">← 카드 관리로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
