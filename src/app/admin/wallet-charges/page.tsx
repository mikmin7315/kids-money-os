import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { requireAdminSession } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/data";
import { formatWon } from "@/lib/format";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminWalletChargeActions } from "@/components/admin/wallet-charge-actions";

export const dynamic = "force-dynamic";

type ChargeRow = {
  id: string;
  parentId: string;
  parentName: string;
  parentEmail: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reviewerName?: string;
  rejectionReason?: string;
  balanceBefore?: number;
  balanceAfter?: number;
};

async function getCharges(): Promise<{ pending: ChargeRow[]; processed: ChargeRow[] }> {
  if (!hasSupabaseEnv()) return { pending: [], processed: [] };
  const supabase = await getSupabaseAdminClient();
  const { data } = await supabase
    .from("parent_wallet_charges")
    .select(`id, parent_id, amount, method, status, created_at,
             reviewed_at, rejection_reason, balance_before, balance_after,
             profiles:parent_id(name, email),
             reviewer:reviewed_by(name)`)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((row) => ({
    id: String(row.id),
    parentId: String(row.parent_id),
    parentName: String((row.profiles as { name?: string })?.name ?? ""),
    parentEmail: String((row.profiles as { email?: string })?.email ?? ""),
    amount: Number(row.amount),
    method: String(row.method ?? ""),
    status: String(row.status),
    createdAt: String(row.created_at),
    reviewedAt: row.reviewed_at ? String(row.reviewed_at) : undefined,
    reviewerName: (row.reviewer as { name?: string })?.name ?? undefined,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    balanceBefore: row.balance_before != null ? Number(row.balance_before) : undefined,
    balanceAfter: row.balance_after != null ? Number(row.balance_after) : undefined,
  }));

  return {
    pending: rows.filter((r) => r.status === "pending"),
    processed: rows.filter((r) => r.status !== "pending"),
  };
}

export default async function AdminWalletChargesPage() {
  await requireAdminSession();
  const { pending, processed } = await getCharges();

  return (
    <MobileAppShell title="충전 요청 관리" subtitle="A-W-01">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
        <ArrowLeft size={16} /> 대시보드로
      </Link>

      <div className="mb-6 rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="text-sm font-bold text-[var(--monari-ink-muted)]">대기 중인 충전 요청</p>
        <p className="mt-1 text-3xl font-black text-[var(--monari-hero)]">{pending.length}건</p>
        <p className="mt-1 text-xs text-[var(--monari-ink-muted)]">
          총 {formatWon(pending.reduce((s, c) => s + c.amount, 0))}
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-2xl">✅</p>
          <p className="mt-3 text-base font-extrabold text-[var(--monari-ink)]">대기 중인 충전 요청이 없어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((charge) => (
            <div key={charge.id} className="rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[var(--monari-ink)]">{charge.parentName}</p>
                  <p className="text-xs text-[var(--monari-ink-muted)]">{charge.parentEmail}</p>
                  <p className="mt-1 text-xs text-[var(--monari-ink-muted)]">
                    {new Date(charge.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-[10px] bg-[#fef3c7] px-2.5 py-1 text-xs font-bold text-[#92400e]">
                  대기
                </span>
              </div>
              <div className="mb-4 rounded-[14px] bg-[var(--monari-hero-lo)] p-3">
                <p className="text-xs font-semibold text-[var(--monari-hero)]">충전 요청 금액</p>
                <p className="mt-1 text-xl font-black text-[var(--monari-hero)]">{formatWon(charge.amount)}</p>
                <p className="mt-0.5 text-xs text-[var(--monari-ink-muted)]">{charge.method}</p>
              </div>
              <AdminWalletChargeActions chargeId={charge.id} />
            </div>
          ))}
        </div>
      )}

      {/* 처리 이력 */}
      {processed.length > 0 && (
        <section className="mt-8">
          <p className="mb-3 text-sm font-extrabold text-[var(--monari-ink)]">처리 이력</p>
          <div className="space-y-2">
            {processed.map((charge) => {
              const isPaid = charge.status === "paid";
              return (
                <div key={charge.id} className="rounded-[16px] bg-white p-4 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-700 text-[var(--monari-ink)]">
                        {charge.parentName} · {formatWon(charge.amount)}
                      </p>
                      <p className="text-[11px] text-[var(--monari-ink-muted)]">
                        {charge.reviewedAt ? new Date(charge.reviewedAt).toLocaleString("ko-KR") : ""}
                        {charge.reviewerName ? ` · ${charge.reviewerName}` : ""}
                      </p>
                      {isPaid && charge.balanceBefore != null && (
                        <p className="mt-0.5 text-[11px] text-[#059669]">
                          잔액 {formatWon(charge.balanceBefore)} → {formatWon(charge.balanceAfter ?? 0)}
                        </p>
                      )}
                      {!isPaid && charge.rejectionReason && (
                        <p className="mt-0.5 text-[11px] text-[#dc2626]">사유: {charge.rejectionReason}</p>
                      )}
                    </div>
                    <span className={`ml-2 shrink-0 rounded-[8px] px-2 py-1 text-[11px] font-700 ${
                      isPaid ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#fee2e2] text-[#991b1b]"
                    }`}>
                      {isPaid ? "승인" : "거절"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </MobileAppShell>
  );
}
