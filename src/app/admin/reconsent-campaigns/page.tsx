import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { ConsentCampaignCreateForm, CampaignStatusButton } from "@/components/admin/consent-campaign-form";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  terms_type: string;
  grace_period_days: number;
  block_on_expire: boolean;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

async function loadCampaigns(): Promise<{ rows: Campaign[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("consent_campaigns")
      .select("id, title, description, terms_type, grace_period_days, block_on_expire, status, started_at, ended_at, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { rows: (data ?? []) as Campaign[] };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "로드 실패" };
  }
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]",
  active: "bg-[#d1fae5] text-[#065f46]",
  ended: "bg-[#fee2e2] text-[#991b1b]",
};
const STATUS_LABEL: Record<string, string> = { draft: "초안", active: "진행 중", ended: "종료" };

function nextStatusInfo(current: string): { status: string; label: string } | null {
  if (current === "draft") return { status: "active", label: "캠페인 시작" };
  if (current === "active") return { status: "ended", label: "캠페인 종료" };
  return null;
}

export default async function ReconsentCampaignsPage() {
  await requireAdminSession();
  const { rows, error } = await loadCampaigns();

  const active = rows.filter((r) => r.status === "active");

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 약관" title="재동의 캠페인 (A-18)" />

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { label: "전체", value: rows.length },
            { label: "진행 중", value: active.length, color: "text-[#059669]" },
            { label: "종료", value: rows.filter((r) => r.status === "ended").length },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-[12px] bg-[var(--monari-surface-soft)] p-3 text-center">
              <p className="text-[10px] font-semibold text-[var(--color-muted)]">{label}</p>
              <p className={`mt-1 text-lg font-black ${color ?? "text-[var(--color-text)]"}`}>{value}</p>
            </div>
          ))}
        </div>

        <section className="mb-6">
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">새 캠페인 생성</p>
          <ConsentCampaignCreateForm />
        </section>

        <section>
          <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">캠페인 목록</p>
          <div className="space-y-3">
            {rows.map((row) => {
              const next = nextStatusInfo(row.status);
              return (
                <div key={row.id} className="rounded-[16px] border border-[var(--color-border)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-[var(--color-text)]">{row.title}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[row.status]}`}>
                          {STATUS_LABEL[row.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">약관 유형: {row.terms_type}</p>
                      {row.description && <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{row.description}</p>}
                      <div className="mt-1.5 flex gap-3 text-[10px] text-[var(--color-muted)]">
                        <span>유예 {row.grace_period_days}일</span>
                        {row.block_on_expire && <span className="font-bold text-[#dc2626]">만료 시 차단</span>}
                        {row.started_at && <span>시작: {row.started_at.slice(0, 10)}</span>}
                        {row.ended_at && <span>종료: {row.ended_at.slice(0, 10)}</span>}
                      </div>
                    </div>
                    {next && <CampaignStatusButton campaignId={row.id} nextStatus={next.status} label={next.label} />}
                  </div>
                </div>
              );
            })}
            {rows.length === 0 && !error && (
              <p className="text-sm text-[var(--color-muted)]">생성된 캠페인이 없습니다.</p>
            )}
          </div>
        </section>
      </MobileShell>
    </PageContainer>
  );
}
