import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

const TX_LABEL: Record<string, string> = {
  allowance: "용돈", bonus: "보너스", interest: "이자", penalty: "차감",
  borrow: "미리쓰기", borrow_repay: "미리쓰기 상환", cash_in: "현금 입금",
  cash_out: "현금 출금", save_in: "저금", save_out: "저금 인출", spend: "지출",
};

export default async function AdminChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const admin = getSupabaseAdminClient();

  const [childRes, txRes, borrowRes, behaviorRes, interestRes] = await Promise.all([
    admin.from("children")
      .select("id, name, nickname, birth_year, created_at, deleted_at, wallet_snapshots(balance, savings_balance, current_interest_rate)")
      .eq("id", id).maybeSingle(),
    admin.from("transactions")
      .select("id, type, amount, memo, created_at")
      .eq("child_id", id).order("created_at", { ascending: false }).limit(20),
    admin.from("borrow_requests")
      .select("id, amount, purpose, status, installments, created_at")
      .eq("child_id", id).order("created_at", { ascending: false }).limit(10),
    admin.from("behavior_logs")
      .select("id, achieved, logged_at, behavior_rules(name)")
      .eq("child_id", id).order("logged_at", { ascending: false }).limit(10),
    admin.from("interest_rate_events")
      .select("id, new_rate, reason, created_at")
      .eq("child_id", id).order("created_at", { ascending: false }).limit(6),
  ]);

  if (!childRes.data) notFound();
  const child = childRes.data;
  const snap = Array.isArray(child.wallet_snapshots) ? child.wallet_snapshots[0] : child.wallet_snapshots;

  const balance = snap?.balance ?? 0;
  const savings = snap?.savings_balance ?? 0;
  const rate = snap?.current_interest_rate ?? 0;

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 아이 상세" title={String(child.name)} />

        {child.deleted_at && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            삭제된 아이 계정 · {String(child.deleted_at).slice(0, 10)}
          </div>
        )}

        {/* 기본 정보 */}
        <section className="mb-5 rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="mb-3 text-xs font-semibold text-[var(--color-muted)]">기본 정보</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "잔액", value: formatWon(balance), color: "text-[#059669]" },
              { label: "저금", value: formatWon(savings), color: "text-[#2563eb]" },
              { label: "이자율", value: `${rate}%`, color: "text-[var(--monari-hero)]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-[12px] bg-[#f9fafb] p-3 text-center">
                <p className="text-[10px] font-semibold text-[var(--color-muted)]">{label}</p>
                <p className={`mt-1 text-sm font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-muted)]">
            <span>닉네임: {String(child.nickname ?? "-")}</span>
            <span>출생연도: {child.birth_year}년</span>
            <span>등록일: {String(child.created_at ?? "").slice(0, 10)}</span>
          </div>
        </section>

        {/* 최근 거래 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">최근 거래 (최대 20건)</p>
          <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            {(txRes.data ?? []).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">거래 내역 없음</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {(txRes.data ?? []).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        {TX_LABEL[String(tx.type)] ?? String(tx.type)}
                      </p>
                      <p className="text-[11px] text-[var(--color-muted)]">
                        {String(tx.memo ?? "")} · {String(tx.created_at ?? "").slice(0, 10)}
                      </p>
                    </div>
                    <span className="tabular-nums text-sm font-bold text-[var(--color-text)]">
                      {formatWon(Number(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 미리쓰기 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">미리쓰기 요청</p>
          <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            {(borrowRes.data ?? []).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">미리쓰기 없음</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {(borrowRes.data ?? []).map((b) => (
                  <div key={b.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{String(b.purpose ?? "-")}</p>
                      <p className="text-[11px] text-[var(--color-muted)]">
                        {String(b.installments)}회 · {String(b.created_at ?? "").slice(0, 10)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-sm font-bold">{formatWon(Number(b.amount))}</p>
                      <span className={`text-[11px] font-bold ${b.status === "approved" ? "text-[#059669]" : b.status === "pending" ? "text-[#d97706]" : "text-[#6b7280]"}`}>
                        {b.status === "approved" ? "승인" : b.status === "pending" ? "대기" : b.status === "repaid" ? "완납" : b.status === "cancelled" ? "취소" : String(b.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 행동 약속 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">최근 행동 기록</p>
          <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            {(behaviorRes.data ?? []).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">행동 기록 없음</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {(behaviorRes.data ?? []).map((b) => {
                  const rule = Array.isArray(b.behavior_rules) ? b.behavior_rules[0] : b.behavior_rules;
                  return (
                    <div key={b.id} className="flex items-center justify-between px-4 py-3">
                      <p className="text-sm text-[var(--color-text)]">{rule?.name ?? "-"}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${b.achieved ? "text-[#059669]" : "text-[#dc2626]"}`}>
                          {b.achieved ? "✓ 달성" : "✗ 미달성"}
                        </span>
                        <span className="text-[11px] text-[var(--color-muted)]">{String(b.logged_at ?? "").slice(0, 10)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 이자율 변동 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">이자율 변동 이력</p>
          <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
            {(interestRes.data ?? []).length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">이자율 변동 없음</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {(interestRes.data ?? []).map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-[var(--color-text)]">{String(e.reason ?? "-")}</p>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[var(--monari-hero)]">{Number(e.new_rate)}%</p>
                      <p className="text-[11px] text-[var(--color-muted)]">{String(e.created_at ?? "").slice(0, 10)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <Link href="/admin/children" className="text-sm font-bold text-[var(--color-accent)]">← 아이 목록</Link>
      </MobileShell>
    </PageContainer>
  );
}
