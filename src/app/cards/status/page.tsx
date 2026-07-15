import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_STEPS = [
  { key: "initiated", label: "신청 접수", desc: "카드 신청이 접수됐어요." },
  { key: "submitted", label: "서류 제출", desc: "파트너사에 서류를 제출했어요." },
  { key: "reviewing", label: "심사 중", desc: "파트너사에서 심사 중이에요." },
  { key: "approved", label: "심사 완료", desc: "카드 발급이 승인됐어요." },
  { key: "issued", label: "카드 발급", desc: "카드가 발급됐어요." },
  { key: "delivery", label: "배송 중", desc: "카드가 배송 중이에요." },
];

const STATUS_ORDER: Record<string, number> = {
  initiated: 0, submitted: 1, reviewing: 2, approved: 3, issued: 4, delivery: 5,
};

export default async function CardStatusPage() {
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const [activeRes, failedRes] = await Promise.all([
    supabase.from("card_applications")
      .select("id, status, partner, child_id, created_at, updated_at, children(name)")
      .eq("parent_id", auth.user!.id)
      .not("status", "in", '("cancelled","rejected")')
      .order("created_at", { ascending: false }),
    supabase.from("card_applications")
      .select("id, status, child_id, notes, created_at, children(name)")
      .eq("parent_id", auth.user!.id)
      .in("status", ["rejected"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const apps = (activeRes.data ?? []).map((r) => {
    const child = Array.isArray(r.children) ? r.children[0] : r.children;
    return { ...r, child_name: String(child?.name ?? "-") };
  });

  const failedApps = (failedRes.data ?? []).map((r) => {
    const child = Array.isArray(r.children) ? r.children[0] : r.children;
    return { ...r, child_name: String(child?.name ?? "-") };
  });

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="카드" title="신청 현황" />

        {/* P-20E: 연동 실패/반려 안내 */}
        {failedApps.map((app) => (
          <div key={app.id} className="mb-4 rounded-[16px] border border-[var(--status-danger-solid-text)]/30 bg-[var(--status-danger-solid)] p-5">
            <div className="mb-3 flex items-center gap-3">
              <span style={{ fontSize: 28 }}>??</span>
              <div>
                <p className="text-sm font-extrabold text-[var(--status-danger-solid-text)]">{app.child_name} 카드 신청 실패</p>
                <p className="text-[11px] text-[var(--monari-minus)]">신청일: {app.created_at.slice(0, 10)}</p>
              </div>
            </div>
            {app.notes && (
              <p className="mb-3 text-xs text-[var(--monari-minus)]">실패 사유: {app.notes}</p>
            )}
            <div className="flex gap-2">
              <Link
                href="/cards/apply"
                className="flex-1 rounded-[10px] bg-[var(--monari-minus)] py-2.5 text-center text-xs font-bold text-white"
              >
                다시 신청하기
              </Link>
              <Link
                href="/inquiries"
                className="flex-1 rounded-[10px] border border-[var(--status-danger-solid-text)]/30 py-2.5 text-center text-xs font-bold text-[var(--status-danger-solid-text)]"
              >
                고객센터 문의
              </Link>
            </div>
          </div>
        ))}

        {apps.length === 0 && failedApps.length === 0 && (
          <div className="rounded-[16px] bg-[var(--monari-surface-soft)] px-5 py-12 text-center">
            <p style={{ fontSize: 32, marginBottom: 8 }}>??</p>
            <p className="text-sm font-semibold text-[var(--color-muted)]">신청 내역이 없어요.</p>
            <Link href="/cards/apply" className="mt-3 inline-block text-sm font-bold text-[var(--color-accent)]">
              카드 신청하기 →
            </Link>
          </div>
        )}

        {apps.map((app) => {
          const currentStep = STATUS_ORDER[app.status] ?? 0;
          return (
            <div key={app.id} className="mb-5 rounded-[16px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[var(--color-text)]">{app.child_name} 카드</p>
                  <p className="text-[11px] text-[var(--color-muted)]">신청일: {app.created_at.slice(0, 10)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  app.status === "delivery" ? "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]" :
                  app.status === "rejected" ? "bg-[var(--status-danger-solid)] text-[var(--status-danger-solid-text)]" :
                  "bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]"
                }`}>
                  {STATUS_STEPS.find(s => s.key === app.status)?.label ?? app.status}
                </span>
              </div>

              <div className="space-y-3">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={step.key} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        done ? "bg-[var(--monari-hero)] text-white" : "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]"
                      }`}>
                        {done ? "?" : i + 1}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${active ? "text-[var(--monari-hero)]" : done ? "text-[var(--color-text)]" : "text-[var(--color-muted)]"}`}>
                          {step.label}
                        </p>
                        {active && <p className="text-[11px] text-[var(--color-muted)]">{step.desc}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-[var(--color-border)] pt-3">
                <p className="text-[11px] text-[var(--color-muted)]">
                  문의가 있으신가요?{" "}
                  <Link href="/inquiries" className="font-bold text-[var(--color-accent)]">고객센터 문의하기</Link>
                </p>
              </div>
            </div>
          );
        })}

        <div className="mt-4">
          <Link href="/cards" className="text-sm font-bold text-[var(--color-accent)]">← 카드 관리로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
