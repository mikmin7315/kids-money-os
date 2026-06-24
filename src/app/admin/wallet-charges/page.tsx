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
};

async function getPendingCharges(): Promise<ChargeRow[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await getSupabaseAdminClient();
  const { data } = await supabase
    .from("parent_wallet_charges")
    .select("id, parent_id, amount, method, status, created_at, profiles:parent_id(name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    parentId: String(row.parent_id),
    parentName: String((row.profiles as { name?: string })?.name ?? ""),
    parentEmail: String((row.profiles as { email?: string })?.email ?? ""),
    amount: Number(row.amount),
    method: String(row.method ?? ""),
    status: String(row.status),
    createdAt: String(row.created_at),
  }));
}

export default async function AdminWalletChargesPage() {
  await requireAdminSession();
  const charges = await getPendingCharges();

  return (
    <MobileAppShell title="충전 요청 관리" subtitle="A-W-01">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]">
        <ArrowLeft size={16} /> 대시보드로
      </Link>

      <div className="mb-6 rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="text-sm font-bold text-[var(--monari-ink-muted)]">대기 중인 충전 요청</p>
        <p className="mt-1 text-3xl font-black text-[var(--monari-hero)]">{charges.length}건</p>
        <p className="mt-1 text-xs text-[var(--monari-ink-muted)]">
          총 {formatWon(charges.reduce((s, c) => s + c.amount, 0))}
        </p>
      </div>

      {charges.length === 0 ? (
        <div className="rounded-[20px] bg-white p-8 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-2xl">✅</p>
          <p className="mt-3 text-base font-extrabold text-[var(--monari-ink)]">대기 중인 충전 요청이 없어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {charges.map((charge) => (
            <div key={charge.id} className="rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
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
              <div className="mb-4 rounded-[14px] bg-[#f5f3ff] p-3">
                <p className="text-xs font-semibold text-[var(--monari-hero)]">충전 요청 금액</p>
                <p className="mt-1 text-xl font-black text-[#4c1d95]">{formatWon(charge.amount)}</p>
                <p className="mt-0.5 text-xs text-[var(--monari-ink-muted)]">{charge.method}</p>
              </div>
              <AdminWalletChargeActions chargeId={charge.id} />
            </div>
          ))}
        </div>
      )}
    </MobileAppShell>
  );
}
