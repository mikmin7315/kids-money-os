import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { MerchantMappingAddForm, MerchantMappingDeleteButton } from "@/components/admin/merchant-mapping-form";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Mapping = {
  id: string;
  merchant_pattern: string;
  category: string;
  created_at: string;
};

async function loadMappings(): Promise<{ rows: Mapping[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("merchant_category_mappings")
      .select("id, merchant_pattern, category, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { rows: (data ?? []) as Mapping[] };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

export default async function MerchantCategoriesPage() {
  await requireAdminSession();
  const { rows, error } = await loadMappings();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 카드" title="가맹점/카테고리 매핑 (A-23)" />

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="mb-6">
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">새 매핑 추가</p>
          <MerchantMappingAddForm />
        </section>

        <section>
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">등록된 매핑</p>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-[var(--color-text)]">{row.merchant_pattern}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">{row.category}</p>
                </div>
                <MerchantMappingDeleteButton mappingId={row.id} />
              </div>
            ))}
            {rows.length === 0 && !error && (
              <p className="text-sm text-[var(--color-text-muted)]">등록된 매핑이 없습니다.</p>
            )}
          </div>
        </section>
      </MobileShell>
    </PageContainer>
  );
}
