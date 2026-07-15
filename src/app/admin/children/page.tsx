import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

type ChildRow = {
  id: string;
  name: string;
  nickname: string;
  birth_year: number;
  parent_name: string;
  balance: number;
  savings_balance: number;
  interest_rate: number;
  created_at: string;
};

async function loadChildren(): Promise<{ rows: ChildRow[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();

    const { data: children, error: cErr } = await admin
      .from("children")
      .select("id, name, nickname, birth_year, parent_id, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (cErr) throw cErr;

    const parentIds = [...new Set((children ?? []).map((c) => c.parent_id))];

    const [{ data: profiles }, { data: wallets }] = await Promise.all([
      admin.from("profiles").select("id, name").in("id", parentIds),
      admin.from("wallet_snapshots").select("child_id, balance, savings_balance, current_interest_rate"),
    ]);

    const profileMap = (profiles ?? []).reduce<Record<string, string>>((acc, p) => {
      acc[p.id] = String(p.name ?? "");
      return acc;
    }, {});
    const walletMap = (wallets ?? []).reduce<Record<string, { balance: number; savings: number; rate: number }>>((acc, w) => {
      acc[w.child_id] = { balance: Number(w.balance), savings: Number(w.savings_balance), rate: Number(w.current_interest_rate) };
      return acc;
    }, {});

    const rows: ChildRow[] = (children ?? []).map((c) => ({
      id: c.id,
      name: String(c.name),
      nickname: String(c.nickname ?? ""),
      birth_year: Number(c.birth_year),
      parent_name: profileMap[c.parent_id] ?? "—",
      balance: walletMap[c.id]?.balance ?? 0,
      savings_balance: walletMap[c.id]?.savings ?? 0,
      interest_rate: walletMap[c.id]?.rate ?? 0,
      created_at: String(c.created_at ?? ""),
    }));

    return { rows };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function AdminChildrenPage() {
  await requireAdminSession();
  const { rows, error } = await loadChildren();

  const totalBalance = rows.reduce((s, r) => s + r.balance, 0);
  const totalSavings = rows.reduce((s, r) => s + r.savings_balance, 0);

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin" title="아이 계정 목록" />

        {error && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { label: "총 아이", value: `${rows.length}명` },
            { label: "총 잔액", value: formatWon(totalBalance) },
            { label: "총 저금", value: formatWon(totalSavings) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-[12px] bg-[var(--monari-surface-soft)] p-3 text-center">
              <p className="text-[10px] font-semibold text-[var(--color-muted)]">{label}</p>
              <p className="mt-1 text-sm font-bold text-[var(--color-text)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-[16px] border border-[var(--color-border)] bg-white">
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--color-muted)]">등록된 아이가 없어요.</p>
          ) : (
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--monari-surface-soft)] text-left text-xs font-semibold text-[var(--color-muted)]">
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">부모</th>
                  <th className="px-4 py-3 text-right">잔액</th>
                  <th className="px-4 py-3 text-right">저금</th>
                  <th className="px-4 py-3 text-center">이자율</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={`cursor-pointer hover:bg-[#fafafa] ${i < rows.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/children/${r.id}`} className="block">
                        <p className="font-semibold text-[var(--color-text)]">{r.name}</p>
                        <p className="text-[11px] text-[var(--color-muted)]">{r.nickname} · {r.birth_year}년생</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{r.parent_name}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{formatWon(r.balance)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-[var(--color-muted)]">{formatWon(r.savings_balance)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-full bg-[var(--monari-hero-lo)] px-2 py-0.5 text-[11px] font-bold text-[var(--monari-hero)]">
                        {r.interest_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
