import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

type ParentRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  child_count: number;
  wallet_balance: number;
};

async function loadParents(): Promise<{ rows: ParentRow[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();

    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("id, name, role, consent_at")
      .in("role", ["parent", "admin"])
      .order("consent_at", { ascending: false });
    if (pErr) throw pErr;

    const { data: { users } = { users: [] }, error: uErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (uErr) throw uErr;

    const { data: children } = await admin.from("children").select("id, parent_id").is("deleted_at", null);
    const { data: wallets } = await admin.from("parent_wallets").select("parent_id, balance");

    const childCountMap = (children ?? []).reduce<Record<string, number>>((acc, c) => {
      acc[c.parent_id] = (acc[c.parent_id] ?? 0) + 1;
      return acc;
    }, {});
    const walletMap = (wallets ?? []).reduce<Record<string, number>>((acc, w) => {
      acc[w.parent_id] = Number(w.balance);
      return acc;
    }, {});

    const rows: ParentRow[] = (profiles ?? []).map((p) => {
      const u = users.find((u) => u.id === p.id);
      return {
        id: p.id,
        name: String(p.name ?? ""),
        email: u?.email ?? "-",
        role: String(p.role),
        created_at: u?.created_at ?? "",
        child_count: childCountMap[p.id] ?? 0,
        wallet_balance: walletMap[p.id] ?? 0,
      };
    });

    return { rows };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function AdminParentsPage() {
  await requireAdminSession();
  const { rows, error } = await loadParents();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin" title="부모 계정 목록" />

        {error && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <p className="mb-4 text-sm text-[var(--color-muted)]">
          총 {rows.length}명
        </p>

        <div className="overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-white">
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--color-muted)]">부모 계정이 없어요.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[#f9fafb] text-left text-xs font-semibold text-[var(--color-muted)]">
                  <th className="px-4 py-3">이름</th>
                  <th className="px-4 py-3">이메일</th>
                  <th className="px-4 py-3 text-center">아이</th>
                  <th className="px-4 py-3 text-right">지갑</th>
                  <th className="px-4 py-3 text-center">역할</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={`${i < rows.length - 1 ? "border-b border-[var(--color-border)]" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-[var(--color-text)]">{r.name || "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">{r.email}</td>
                    <td className="px-4 py-3 text-center">{r.child_count}명</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-[var(--color-text)]">
                      {formatWon(r.wallet_balance)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${r.role === "admin" ? "bg-[#fef3c7] text-[#92400e]" : "bg-[#ede9fe] text-[#5b21b6]"}`}>
                        {r.role}
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
