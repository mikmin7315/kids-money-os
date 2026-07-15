import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { TermsCreateForm } from "@/components/admin/terms-form";
import { ActivateTermsButton } from "@/components/admin/activate-terms-button";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  service: "이용약관",
  privacy: "개인정보처리방침",
  marketing: "마케팅 수신 동의",
};

export default async function AdminTermsPage() {
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  const { data } = await admin
    .from("terms")
    .select("id, type, version, title, is_active, published_at, created_at")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as {
    id: string; type: string; version: string; title: string;
    is_active: boolean; published_at: string | null; created_at: string;
  }[];

  const grouped = rows.reduce<Record<string, typeof rows>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 약관" title="약관 관리" />

        <section className="mb-6">
          <TermsCreateForm />
        </section>

        {Object.entries(grouped).map(([type, items]) => (
          <section key={type} className="mb-5">
            <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">{TYPE_LABEL[type] ?? type}</p>
            <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[var(--color-border)]">
              {items.map((r) => (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.is_active ? "bg-[#d1fae5] text-[#065f46]" : "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]"}`}>
                          {r.is_active ? "활성" : "비활성"}
                        </span>
                        <span className="text-[11px] font-bold text-[var(--color-muted)]">v{r.version}</span>
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{r.title}</p>
                      <p className="text-[11px] text-[var(--color-muted)]">
                        {r.published_at ? `활성화: ${r.published_at.slice(0, 10)}` : `등록: ${r.created_at.slice(0, 10)}`}
                      </p>
                    </div>
                    {!r.is_active && <ActivateTermsButton id={r.id} type={r.type} />}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {rows.length === 0 && (
          <div className="rounded-[16px] bg-[var(--monari-surface-soft)] px-5 py-10 text-center text-sm text-[var(--color-muted)]">
            등록된 약관이 없어요. 위 양식으로 첫 약관을 등록해주세요.
          </div>
        )}

        <div className="mt-6">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
