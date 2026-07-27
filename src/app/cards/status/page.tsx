import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
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
    <AppNavShell>
      <PageHero>
        <Link href="/cards" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 카드 관리로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">카드</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">신청 현황</h1>
        <p className="text-[13px] text-white/65">심사 진행 중 {apps.length}건</p>
      </PageHero>

      <PageContent className="pt-5 space-y-4">
        {/* 반려된 신청 */}
        {failedApps.map((app) => (
          <div
            key={app.id}
            className="rounded-[16px] border border-red-200 bg-red-50 p-5"
          >
            <p className="text-[14px] font-extrabold text-red-800 mb-1">{app.child_name} 카드 신청 실패</p>
            <p className="text-[12px] text-red-600 mb-3">신청일: {app.created_at.slice(0, 10)}</p>
            {app.notes && (
              <p className="text-[12px] text-red-700 mb-3">실패 사유: {app.notes}</p>
            )}
            <div className="flex gap-2">
              <Link
                href="/cards/apply"
                className="flex-1 rounded-[10px] bg-red-600 py-2.5 text-center text-[12px] font-bold text-white"
              >
                다시 신청하기
              </Link>
              <Link
                href="/inquiries"
                className="flex-1 rounded-[10px] border border-red-300 py-2.5 text-center text-[12px] font-bold text-red-700"
              >
                고객센터 문의
              </Link>
            </div>
          </div>
        ))}

        {/* 진행 중인 신청 없음 */}
        {apps.length === 0 && failedApps.length === 0 && (
          <div className="monari-card px-5 py-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
              <CheckCircle2 size={26} />
            </span>
            <p className="mt-4 text-[15px] font-800 text-[var(--monari-ink)]">신청 내역이 없어요</p>
            <Link href="/cards/apply" className="mt-4 inline-block text-[13px] font-bold text-[var(--monari-hero)]">
              카드 신청하기 →
            </Link>
          </div>
        )}

        {/* 진행 중인 신청 목록 */}
        {apps.length > 0 && (
          <section>
            <SectionTitle>진행 중인 신청</SectionTitle>
            <div className="mt-3 space-y-4">
              {apps.map((app) => {
                const currentStep = STATUS_ORDER[app.status] ?? 0;
                return (
                  <div key={app.id} className="monari-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--monari-line)]">
                      <div>
                        <p className="text-[15px] font-extrabold text-[var(--monari-ink)]">{app.child_name} 카드</p>
                        <p className="text-[12px] text-[var(--monari-ink-muted)]">신청일: {app.created_at.slice(0, 10)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        app.status === "delivery"
                          ? "bg-[var(--status-success-solid)] text-[var(--status-success-solid-text)]"
                          : "bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]"
                      }`}>
                        {STATUS_STEPS.find((s) => s.key === app.status)?.label ?? app.status}
                      </span>
                    </div>

                    <div className="px-4 py-4 space-y-3">
                      {STATUS_STEPS.map((step, i) => {
                        const done = i <= currentStep;
                        const active = i === currentStep;
                        return (
                          <div key={step.key} className="flex items-start gap-3">
                            <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              done
                                ? "bg-[var(--monari-hero)] text-white"
                                : "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]"
                            }`}>
                              {done ? "✓" : i + 1}
                            </div>
                            <div>
                              <p className={`text-[12px] font-bold ${
                                active
                                  ? "text-[var(--monari-hero)]"
                                  : done
                                  ? "text-[var(--monari-ink)]"
                                  : "text-[var(--monari-ink-muted)]"
                              }`}>
                                {step.label}
                              </p>
                              {active && (
                                <p className="text-[11px] text-[var(--monari-ink-muted)]">{step.desc}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-[var(--monari-line)] px-4 py-3">
                      <p className="text-[11px] text-[var(--monari-ink-muted)]">
                        문의가 있으신가요?{" "}
                        <Link href="/inquiries" className="font-bold text-[var(--monari-hero)]">
                          고객센터 문의하기
                        </Link>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </PageContent>
    </AppNavShell>
  );
}
