import { redirect } from "next/navigation";
import { AlertCircle, ArrowLeft, CalendarDays, CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { AllowanceRuleForm } from "@/components/finance/management-forms";
import { DeleteAllowanceRuleButton } from "@/components/finance/delete-rule-button";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AllowancePage() {
  const auth = await requireParentSession();
  if (!auth.user) redirect("/login");

  const bundle = await getAppDataBundle();
  const hasChildren = bundle.children.length > 0;
  const failedExecutions = bundle.allowanceExecutions.filter((e) => e.status === "failed");

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">금융 설정</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">정기 용돈</h1>
        <p className="text-[13px] text-white/65">매달 자동으로 지급돼요</p>
      </PageHero>

      <PageContent className="pt-5">

        {/* 용돈 안내 */}
        <div className="mb-5 rounded-[16px] bg-[var(--monari-hero-lo)] px-4 py-4">
          <p className="text-[12px] font-bold text-[var(--monari-hero)] mb-2">용돈은 어떻게 지급되나요?</p>
          <ul className="space-y-1 text-[12px] leading-5 text-[var(--monari-hero)]">
            <li>• 매주·매월 설정한 날에 자동으로 남긴 돈에 더해져요</li>
            <li>• 지급 후 아이에게 알림이 가요</li>
            <li>• 즉시 지급은 아이 통장 페이지에서 할 수 있어요</li>
          </ul>
        </div>

        {/* 현재 설정된 용돈 */}
        {bundle.allowanceRules.length > 0 && (
          <section className="mb-5">
            <SectionTitle>현재 설정된 용돈</SectionTitle>
            <div className="mt-3 space-y-2">
              {bundle.allowanceRules.map((rule) => {
                const child = bundle.children.find((c) => c.id === rule.childId);
                const cycle =
                  rule.type === "weekly"
                    ? `매주 ${["일", "월", "화", "수", "목", "금", "토"][rule.weekday ?? 6]}요일`
                    : rule.type === "monthly"
                      ? `매월 ${rule.dayOfMonth ?? 1}일`
                      : "직접 지급";
                return (
                  <div
                    key={rule.id}
                    className="monari-card flex items-center gap-3 px-4 py-3.5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--monari-done-bg)] text-[var(--monari-done)]">
                      <CalendarDays size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-extrabold text-[var(--monari-ink)] truncate">
                        {child?.name} · {rule.title}
                      </p>
                      <p className="text-[12px] text-[var(--monari-ink-muted)]">{cycle}</p>
                    </div>
                    <p className="text-[15px] font-black text-[var(--monari-done)] shrink-0">{formatWon(rule.amount)}</p>
                    <DeleteAllowanceRuleButton ruleId={rule.id} label={rule.title} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 미지급 내역 */}
        {failedExecutions.length > 0 && (
          <section className="mb-5">
            <SectionTitle>미지급 내역</SectionTitle>
            <div className="mt-3 space-y-2">
              {failedExecutions.slice(0, 10).map((exec) => {
                const rule = bundle.allowanceRules.find((r) => r.id === exec.allowanceRuleId);
                const child = bundle.children.find((c) => c.id === rule?.childId);
                return (
                  <div key={exec.id} className="flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
                    <AlertCircle size={17} className="mt-0.5 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-red-700 dark:text-red-400">
                        {child?.name} · {rule?.title ?? "삭제된 규칙"} · {exec.scheduledDate}
                      </p>
                      <p className="mt-0.5 text-[12px] text-red-500">
                        {exec.failureReason ?? "알 수 없는 오류"}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div className="rounded-[14px] bg-red-50 px-4 py-3 dark:bg-red-950/30">
                <p className="text-[12px] text-red-600 dark:text-red-400">
                  부모 지갑 잔액이 부족해 지급되지 않은 경우,{" "}
                  <Link href="/settings/wallet" className="font-bold underline">지갑을 충전</Link>하면
                  다음 지급일에 자동으로 처리돼요.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 새 규칙 추가 */}
        <section className="mb-6">
          <SectionTitle>새 용돈 규칙 추가</SectionTitle>
          <div className="monari-card mt-3 p-5">
            {!hasChildren ? (
              <div className="py-4 text-center">
                <CircleDollarSign className="mx-auto mb-3 text-[var(--monari-ink-muted)]" size={28} />
                <p className="text-[14px] font-extrabold text-[var(--monari-ink)]">아이 프로필을 먼저 등록해주세요</p>
                <Link href="/settings" className="mt-3 inline-block text-[13px] font-bold text-[var(--monari-hero)]">
                  설정으로 가기 →
                </Link>
              </div>
            ) : (
              <AllowanceRuleForm childOptions={bundle.children} />
            )}
          </div>
        </section>

      </PageContent>
    </AppNavShell>
  );
}
