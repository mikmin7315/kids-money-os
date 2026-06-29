import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "정상", frozen: "정지", lost: "분실", cancelled: "해지", expired: "만료",
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-[#d1fae5] text-[#065f46]",
  frozen: "bg-[#dbeafe] text-[#1e40af]",
  lost: "bg-[#fee2e2] text-[#991b1b]",
  cancelled: "bg-[#f3f4f6] text-[#6b7280]",
  expired: "bg-[#f3f4f6] text-[#6b7280]",
};

export default async function AdminCardsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  let q = admin
    .from("child_cards")
    .select("id, status, is_enabled, daily_limit, monthly_limit, last4, child_id, created_at, children(name)")
    .order("created_at", { ascending: false })
    .limit(60);
  if (status) q = q.eq("status", status);

  const { data } = await q;
  const cards = (data ?? []).map((c) => {
    const child = Array.isArray(c.children) ? c.children[0] : c.children;
    return { ...c, child_name: String(child?.name ?? "-") };
  });

  const { data: counts } = await admin
    .from("child_cards")
    .select("status");
  const statusCounts = (counts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const statuses = ["active", "frozen", "lost", "cancelled", "expired"];

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 카드" title="카드 목록" />

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/admin/cards"
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${!status ? "bg-[var(--color-accent)] text-white" : "bg-[#f3f4f6]"}`}
          >
            전체 {counts?.length ?? 0}
          </Link>
          {statuses.map((s) => (
            <Link
              key={s}
              href={`/admin/cards?status=${s}`}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${status === s ? "bg-[var(--color-accent)] text-white" : "bg-[#f3f4f6]"}`}
            >
              {STATUS_LABEL[s]} {statusCounts[s] ?? 0}
            </Link>
          ))}
        </div>

        <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[var(--color-border)]">
          {cards.map((c) => (
            <Link key={c.id} href={`/admin/cards/${c.id}`} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{c.child_name}</p>
                <p className="text-[11px] text-[var(--color-muted)]">
                  {c.last4 ? `**** ${c.last4}` : "미발급"} · 일 {formatWon(Number(c.daily_limit))}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLOR[c.status] ?? ""}`}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
                {!c.is_enabled && <span className="text-[10px] text-[#d97706]">비활성</span>}
              </div>
            </Link>
          ))}
          {cards.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-[var(--color-muted)]">해당 상태의 카드가 없어요.</div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <Link href="/admin/cards/logs" className="block text-sm font-bold text-[var(--color-accent)]">연동 로그 →</Link>
          <Link href="/admin" className="block text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
