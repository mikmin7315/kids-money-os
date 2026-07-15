import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { AppConfigForm } from "@/components/admin/app-config-form";
import { CashCorrectionForm } from "@/components/admin/cash-correction-form";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

type CorrectionLog = {
  id: string;
  child_id: string;
  tx_date: string;
  type: string;
  amount: number;
  memo: string | null;
  created_at: string;
};

async function loadData() {
  const admin = getSupabaseAdminClient();

  const { data: children } = await admin.from("children").select("id, name").is("deleted_at", null);

  const { data: configRow } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "cash_correction_max_amount")
    .maybeSingle();

  const { data: corrections } = await admin
    .from("money_transactions")
    .select("id, child_id, tx_date, type, amount, memo, created_at")
    .ilike("memo", "[현금 정정]%")
    .order("created_at", { ascending: false })
    .limit(50);

  const childMap = new Map((children ?? []).map((c) => [String(c.id), String(c.name)]));

  return {
    children: (children ?? []).map((c) => ({ id: String(c.id), name: String(c.name) })),
    maxAmount: String(configRow?.value ?? 500000),
    corrections: (corrections ?? []) as CorrectionLog[],
    childMap,
  };
}

export default async function CashCorrectionsPage() {
  await requireAdminSession();
  const { children, maxAmount, corrections, childMap } = await loadData();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 운영" title="현금 정정/정책 (A-13)" />

        <section className="mb-6">
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">정정 정책</p>
          <div className="rounded-[14px] border border-[var(--color-border)] p-4">
            <p className="mb-2 text-xs text-[var(--color-muted)]">1회 최대 정정 허용 금액 (원)</p>
            <AppConfigForm configKey="cash_correction_max_amount" currentValue={maxAmount} />
          </div>
        </section>

        <section className="mb-6">
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">새 현금 정정</p>
          <CashCorrectionForm childOptions={children} />
        </section>

        <section>
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">정정 이력</p>
          <div className="space-y-2">
            {corrections.map((c) => (
              <div key={c.id} className="rounded-[14px] border border-[var(--color-border)] px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[var(--color-text)]">{childMap.get(c.child_id) ?? "알 수 없음"}</p>
                  <p className={`tabular-nums text-sm font-bold ${c.type === "spend" ? "text-[var(--monari-minus)]" : "text-[var(--monari-done)]"}`}>
                    {c.type === "spend" ? "-" : "+"}{formatWon(c.amount)}
                  </p>
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">{c.memo}</p>
                <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">{c.tx_date}</p>
              </div>
            ))}
            {corrections.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">정정 이력이 없습니다.</p>
            )}
          </div>
        </section>
      </MobileShell>
    </PageContainer>
  );
}
