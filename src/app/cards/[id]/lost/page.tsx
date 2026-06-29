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
          <AppHeader eyebrow="카드" title="분실 신고" />
          <div className="flex flex-col items-center py-10 text-center">
            <p style={{ fontSize: 48, marginBottom: 12 }}>🔒</p>
            <p className="text-base font-extrabold text-[var(--color-text)]">이미 분실 신고된 카드예요</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">재발급을 원하시면 고객센터에 문의해주세요.</p>
            <div className="mt-6 flex gap-3">
              <Link href="/cards" className="rounded-[12px] border border-[var(--color-border)] px-5 py-2.5 text-sm font-bold">카드 관리로</Link>
              <Link href="/inquiries" className="rounded-[12px] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-white">재발급 문의</Link>
            </div>
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
