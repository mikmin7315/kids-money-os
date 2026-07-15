import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { CardLostForm } from "@/components/cards/card-lost-form";

export const dynamic = "force-dynamic";

export default async function CardLostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data: card } = await supabase
    .from("child_cards")
    .select("id, status, child_id, children(name)")
    .eq("id", id)
    .eq("parent_id", auth.user!.id)
    .maybeSingle();

  if (!card) notFound();
  const child = Array.isArray(card.children) ? card.children[0] : card.children;

  if (card.status === "lost") {
    return (
      <PageContainer>
        <MobileShell>
          <AppHeader eyebrow="카드 · P-22" title="카드 재발급" />
          <div className="mb-6 flex flex-col items-center py-6 text-center">
            <p style={{ fontSize: 48, marginBottom: 12 }}>🔒</p>
            <p className="text-base font-extrabold text-[var(--color-text)]">분실 신고된 카드예요</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">분실 신고 후 카드는 사용이 중지됐어요.</p>
          </div>
          <div className="mb-4 rounded-[16px] bg-[#f5f3ff] p-5">
            <p className="mb-3 text-sm font-extrabold text-[#5b21b6]">📬 재발급 안내</p>
            <ul className="space-y-2 text-[13px] text-[#7c3aed]">
              <li>• 재발급은 고객센터 문의를 통해 진행돼요.</li>
              <li>• 기존 카드 번호는 변경되며 새 카드가 발급돼요.</li>
              <li>• 재발급 소요 기간: 영업일 기준 3~5일</li>
              <li>• 재발급 중 카드 사용은 불가해요.</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Link href="/cards" className="flex-1 rounded-[12px] border border-[var(--color-border)] py-3 text-center text-sm font-bold">
              카드 관리로
            </Link>
            <Link href="/inquiries" className="flex-1 rounded-[12px] bg-[var(--color-accent)] py-3 text-center text-sm font-bold text-white">
              재발급 신청하기
            </Link>
          </div>
        </MobileShell>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="카드" title="분실 신고" />
        <CardLostForm cardId={card.id} childName={String(child?.name ?? "")} />
        <div className="mt-4">
          <Link href="/cards" className="text-sm font-bold text-[var(--color-accent)]">← 카드 관리로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
