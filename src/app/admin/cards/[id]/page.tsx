import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  const [cardRes, txRes, logRes] = await Promise.all([
    admin.from("child_cards")
      .select("*, children(name, parent_id), profiles!child_cards_parent_id_fkey(email)")
      .eq("id", id)
      .maybeSingle(),
    admin.from("card_transactions")
      .select("id, merchant_name, amount, status, approved_at, merchant_category")
      .eq("card_id", id)
      .order("approved_at", { ascending: false })
      .limit(10),
    admin.from("card_integration_logs")
      .select("id, event_type, status_code, error_message, created_at")
      .eq("card_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!cardRes.data) notFound();
  const card = cardRes.data;
  const child = Array.isArray(card.children) ? card.children[0] : card.children;
  const parent = Array.isArray(card.profiles) ? card.profiles[0] : card.profiles;

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 카드" title="카드 상세" />

        {/* 카드 기본 정보 */}
        <section className="mb-4 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-extrabold">{String(child?.name ?? "-")} 카드</p>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              card.status === "active" ? "bg-[#d1fae5] text-[#065f46]" :
              card.status === "lost" ? "bg-[#fee2e2] text-[#991b1b]" :
              "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]"
            }`}>{card.status}</span>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ["카드번호", card.last4 ? `**** ${card.last4}` : "미발급"],
              ["사용 가능", card.is_enabled ? "✓ 활성" : "✗ 비활성"],
              ["일 한도", formatWon(Number(card.daily_limit))],
              ["월 한도", formatWon(Number(card.monthly_limit))],
              ["부모", String(parent?.email ?? "-")],
              ["발급일", card.issued_at ? String(card.issued_at).slice(0, 10) : "-"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between">
                <span className="text-[var(--color-muted)]">{l}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 최근 거래 */}
        <section className="mb-4">
          <p className="mb-2 text-sm font-extrabold">최근 거래</p>
          {(txRes.data ?? []).length === 0 ? (
            <div className="rounded-[16px] bg-[var(--monari-surface-soft)] py-6 text-center text-sm text-[var(--color-muted)]">거래 내역 없음</div>
          ) : (
            <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[var(--color-border)]">
              {(txRes.data ?? []).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{t.merchant_name || "미상"}</p>
                    <p className="text-[11px] text-[var(--color-muted)]">{t.merchant_category} · {String(t.approved_at ?? "").slice(0, 10)}</p>
                  </div>
                  <p className="tabular-nums text-sm font-bold">{formatWon(Number(t.amount))}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 연동 로그 */}
        <section className="mb-4">
          <p className="mb-2 text-sm font-extrabold">최근 연동 로그</p>
          {(logRes.data ?? []).length === 0 ? (
            <div className="rounded-[16px] bg-[var(--monari-surface-soft)] py-6 text-center text-sm text-[var(--color-muted)]">로그 없음</div>
          ) : (
            <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[var(--color-border)]">
              {(logRes.data ?? []).map((l) => (
                <div key={l.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{l.event_type}</p>
                    <span className={`text-xs font-bold ${l.status_code && l.status_code < 300 ? "text-[#059669]" : "text-[#dc2626]"}`}>
                      {l.status_code ?? "-"}
                    </span>
                  </div>
                  {l.error_message && <p className="mt-1 text-[11px] text-[#dc2626]">{l.error_message}</p>}
                  <p className="text-[10px] text-[var(--color-muted)]">{String(l.created_at ?? "").slice(0, 19)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-4 space-y-2">
          <Link href="/admin/cards" className="block text-sm font-bold text-[var(--color-accent)]">← 카드 목록으로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
