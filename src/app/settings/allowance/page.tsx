import { redirect } from "next/navigation";
import { AlertCircle, ArrowLeft, CalendarDays, CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { AllowanceRuleForm } from "@/components/finance/management-forms";
import { DeleteAllowanceRuleButton } from "@/components/finance/delete-rule-button";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AllowancePage() {
  const auth = await requireParentSession();
  if (!auth.user) redirect("/login");

  const bundle = await getAppDataBundle();
  const hasChildren = bundle.children.length > 0;

  return (
    <MobileAppShell title="정기 용돈 설정" subtitle="용돈 규칙 관리">
      {/* 뒤로가기 */}
      <Link
        href="/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]"
      >
        <ArrowLeft size={16} /> 설정으로
      </Link>

      {/* 히어로 */}
      <section
        className="relative mb-6 overflow-hidden rounded-[24px] p-6 text-white"
        style={{
          background: "linear-gradient(145deg,#059669 0%,#10b981 60%,#34d399 100%)",
          boxShadow: "0 16px 40px rgba(5,150,105,0.35)",
        }}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-[13px] font-semibold text-white/70">매달 자동으로 지급돼요</p>
          <h2 className="mt-1 text-xl font-black tracking-tight">정기 용돈 설정</h2>
          <p className="mt-2 text-sm text-white/75">
            용돈 금액과 지급 주기를 정하면, 약속한 날에 자동으로 남긴 돈에 더해줘요.
          </p>
        </div>
      </section>

      {/* 현재 설정 현황 */}
      {bundle.allowanceRules.length > 0 && (
        <section className="mb-6">
          <p className="mb-3 text-sm font-extrabold text-[var(--monari-ink)]">현재 설정된 용돈</p>
          <div className="space-y-2">
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
                  className="flex items-center justify-between rounded-[16px] bg-white p-4 shadow-[var(--monari-shadow-md)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--status-success-solid)] text-[var(--monari-done)]">
                      <CalendarDays size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-[var(--monari-ink)]">
                        {child?.name} · {rule.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--monari-ink-muted)]">{cycle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-black text-[var(--monari-done)]">{formatWon(rule.amount)}</p>
                    <DeleteAllowanceRuleButton ruleId={rule.id} label={rule.title} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 안내 박스 */}
      <div className="mb-6 rounded-[16px] bg-[var(--status-success-solid)] p-4">
        <p className="text-xs font-bold text-[var(--status-success-solid-text)]">💡 용돈은 어떻게 지급되나요?</p>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--monari-done)]">
          <li>• 매주·매월 설정한 날에 자동으로 남긴 돈에 더해져요</li>
          <li>• 지급 후 아이에게 알림이 가요</li>
          <li>• 즉시 지급은 아이 통장 페이지에서 할 수 있어요</li>
        </ul>
      </div>

      {/* 실패 내역 */}
      {bundle.allowanceExecutions.filter((e) => e.status === "failed").length > 0 && (
        <section className="mb-6">
          <p className="mb-3 text-sm font-extrabold text-[var(--status-danger-solid-text)]">⚠️ 미지급 내역</p>
          <div className="space-y-2">
            {bundle.allowanceExecutions
              .filter((e) => e.status === "failed")
              .slice(0, 10)
              .map((exec) => {
                const rule = bundle.allowanceRules.find((r) => r.id === exec.allowanceRuleId);
                const child = bundle.children.find((c) => c.id === rule?.childId);
                return (
                  <div key={exec.id} className="flex items-start gap-3 rounded-[16px] border border-[var(--status-danger-solid-text)]/30 bg-[var(--status-danger-solid)] p-4">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-[var(--monari-minus)]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-700 text-[var(--status-danger-solid-text)]">
                        {child?.name} · {rule?.title ?? "삭제된 규칙"} · {exec.scheduledDate}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[var(--monari-minus)]">
                        {exec.failureReason ?? "알 수 없는 오류"}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-3 rounded-[14px] bg-[var(--status-danger-solid)] px-4 py-3">
            <p className="text-[12px] text-[var(--monari-minus)]">
              💳 부모 지갑 잔액이 부족해 지급되지 않은 경우,{" "}
              <Link href="/settings/wallet" className="font-700 underline">지갑을 충전</Link>하면
              다음 지급일에 자동으로 처리돼요.
            </p>
          </div>
        </section>
      )}

      {/* 폼 */}
      {!hasChildren ? (
        <div className="rounded-[24px] bg-white p-6 text-center shadow-[var(--monari-shadow-md)]">
          <CircleDollarSign className="mx-auto mb-3 text-[var(--monari-ink-muted)]" size={32} />
          <p className="text-sm font-extrabold text-[var(--monari-ink)]">아이 프로필을 먼저 등록해주세요</p>
          <Link href="/settings" className="mt-3 inline-block text-sm font-bold text-[var(--monari-hero)]">
            설정으로 가기 →
          </Link>
        </div>
      ) : (
        <div className="rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
          <p className="mb-4 text-sm font-extrabold text-[var(--monari-ink)]">새 용돈 규칙 추가</p>
          <AllowanceRuleForm childOptions={bundle.children} />
        </div>
      )}
    </MobileAppShell>
  );
}
