import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  childId: string;
  childName: string;
  ledgerBalance: number;
  snapshotBalance: number;
  diff: number;
};

const CREDIT_TYPES = new Set(["allowance", "reward", "interest", "borrow", "unsave"]);
const DEBIT_TYPES = new Set(["spend", "save", "repay"]);

async function verifyBalances(): Promise<{ rows: Row[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();

    const { data: children, error: cErr } = await admin.from("children").select("id, name").is("deleted_at", null);
    if (cErr) throw cErr;

    const { data: snapshots, error: sErr } = await admin.from("wallet_snapshots").select("child_id, balance");
    if (sErr) throw sErr;
    const snapshotMap = new Map((snapshots ?? []).map((s) => [String(s.child_id), Number(s.balance)]));

    const { data: txs, error: tErr } = await admin.from("money_transactions").select("child_id, type, amount");
    if (tErr) throw tErr;

    const ledgerMap = new Map<string, number>();
    (txs ?? []).forEach((tx) => {
      const childId = String(tx.child_id);
      const amount = Number(tx.amount);
      const type = String(tx.type);
      const delta = CREDIT_TYPES.has(type) ? amount : DEBIT_TYPES.has(type) ? -amount : 0;
      ledgerMap.set(childId, (ledgerMap.get(childId) ?? 0) + delta);
    });

    const rows: Row[] = (children ?? []).map((c) => {
      const childId = String(c.id);
      const ledgerBalance = ledgerMap.get(childId) ?? 0;
      const snapshotBalance = snapshotMap.get(childId) ?? 0;
      return {
        childId,
        childName: String(c.name),
        ledgerBalance,
        snapshotBalance,
        diff: snapshotBalance - ledgerBalance,
      };
    });

    return { rows };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "검증 실패" };
  }
}

export default async function BalanceVerificationPage() {
  await requireAdminSession();
  const { rows, error } = await verifyBalances();
  const mismatches = rows.filter((r) => r.diff !== 0);

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 운영" title="잔액 검증 (A-07B/C)" />

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-[12px] bg-[var(--monari-surface-soft)] p-3 text-center">
            <p className="text-[10px] font-semibold text-[var(--color-muted)]">전체 아이</p>
            <p className="mt-1 text-lg font-black text-[var(--color-text)]">{rows.length}</p>
          </div>
          <div className="rounded-[12px] bg-[var(--monari-surface-soft)] p-3 text-center">
            <p className="text-[10px] font-semibold text-[var(--color-muted)]">불일치</p>
            <p className={`mt-1 text-lg font-black ${mismatches.length > 0 ? "text-[#dc2626]" : "text-[#059669]"}`}>{mismatches.length}</p>
          </div>
        </div>

        <section>
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">원장 합계 vs 지갑 스냅샷</p>
          <div className="overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--monari-surface-soft)] text-left text-xs font-semibold text-[var(--color-muted)]">
                  <th className="px-4 py-3">아이</th>
                  <th className="px-4 py-3 text-right">원장 합계</th>
                  <th className="px-4 py-3 text-right">스냅샷</th>
                  <th className="px-4 py-3 text-right">차이</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.childId} className={`${i < rows.length - 1 ? "border-b border-[var(--color-border)]" : ""} ${r.diff !== 0 ? "bg-[#fff1f2]" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-[var(--color-text)]">{r.childName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatWon(r.ledgerBalance)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatWon(r.snapshotBalance)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-bold ${r.diff !== 0 ? "text-[#dc2626]" : "text-[#059669]"}`}>
                      {r.diff === 0 ? "일치" : formatWon(r.diff)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && !error && (
              <p className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">검증할 아이가 없습니다.</p>
            )}
          </div>
        </section>
      </MobileShell>
    </PageContainer>
  );
}
