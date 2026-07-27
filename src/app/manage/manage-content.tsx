"use client";

import { useState } from "react";
import { AlertCircle, CalendarDays, CircleDollarSign, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { BehaviorRuleCreateForm, AllowanceRuleForm } from "@/components/finance/management-forms";
import {
  DeleteBehaviorRuleButton,
  ToggleBehaviorRuleButton,
  DeleteAllowanceRuleButton,
} from "@/components/finance/delete-rule-button";
import { InterestPolicyCard } from "@/components/finance/interest-policy-card";
import { SectionTitle } from "@/components/monari/ui";
import { type AppDataBundle } from "@/lib/data";
import { formatPercent, formatWon } from "@/lib/format";

type Tab = "behaviors" | "allowance" | "interest";

export function ManageContent({ bundle, initialTab = "behaviors" }: { bundle: AppDataBundle; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [showBehaviorForm, setShowBehaviorForm] = useState(false);
  const [showAllowanceForm, setShowAllowanceForm] = useState(false);
  const hasChildren = bundle.children.length > 0;

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-5 flex gap-2">
        {(
          [
            { key: "behaviors", label: "행동 약속" },
            { key: "allowance", label: "정기 용돈" },
            { key: "interest", label: "이자 설정" },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-[14px] py-2.5 text-[13px] font-bold transition ${
              tab === key
                ? "bg-[var(--monari-hero)] text-white"
                : "bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Behaviors tab */}
      {tab === "behaviors" && (
        <div className="space-y-4">
          <section>
            <div className="flex items-center justify-between">
              <SectionTitle>약속 목록</SectionTitle>
              <button
                type="button"
                onClick={() => setShowBehaviorForm((v) => !v)}
                className="flex items-center gap-1 rounded-[10px] bg-[var(--monari-hero)] px-3 py-1.5 text-[12px] font-bold text-white"
              >
                <Plus size={13} />
                새 약속
              </button>
            </div>

            {showBehaviorForm && (
              <div className="monari-card mt-3 p-4">
                <BehaviorRuleCreateForm />
              </div>
            )}

            {bundle.behaviorRules.length === 0 ? (
              <div className="monari-card mt-3 px-4 py-5 text-center">
                <p className="text-[14px] font-bold text-[var(--monari-ink)]">아직 약속이 없어요</p>
                <p className="monari-meta mt-1">위의 새 약속 버튼으로 만들어보세요</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {bundle.behaviorRules.map((rule) => (
                  <div key={rule.id} className="monari-card p-4" style={{ opacity: rule.isActive ? 1 : 0.55 }}>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-[15px] font-extrabold text-[var(--monari-ink)] leading-tight">{rule.title}</p>
                        {rule.description && (
                          <p className="mt-1 text-[12px] text-[var(--monari-ink-soft)]">{rule.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ToggleBehaviorRuleButton ruleId={rule.id} isActive={rule.isActive} label={rule.title} />
                        <DeleteBehaviorRuleButton ruleId={rule.id} label={rule.title} />
                      </div>
                    </div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex h-[24px] items-center rounded-[8px] px-2.5 text-[11px] font-bold ${
                          rule.requiresParentApproval
                            ? "bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]"
                            : "bg-[var(--monari-done-bg)] text-[var(--monari-done)]"
                        }`}
                      >
                        {rule.requiresParentApproval ? "확인 후 반영" : "자동 반영"}
                      </span>
                      {!rule.isActive && (
                        <span className="inline-flex h-[24px] items-center rounded-[8px] px-2.5 text-[11px] font-bold bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]">
                          비활성
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <MetricBox label="약속 보상" value={formatWon(rule.rewardAmount)} />
                      <MetricBox
                        label="이자율 변화"
                        value={rule.interestDelta !== 0 ? `+${formatPercent(rule.interestDelta)}` : "—"}
                        sub={
                          rule.ruleCategory === "recurring"
                            ? `${rule.monthlyTargetRate}% 달성 시`
                            : "한 번 달성 시"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Allowance tab */}
      {tab === "allowance" && (
        <div className="space-y-4">
          <section>
            <div className="flex items-center justify-between">
              <SectionTitle>정기 용돈</SectionTitle>
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => setShowAllowanceForm((v) => !v)}
                  className="flex items-center gap-1 rounded-[10px] bg-[var(--monari-hero)] px-3 py-1.5 text-[12px] font-bold text-white"
                >
                  <Plus size={13} />
                  새 규칙
                </button>
              )}
            </div>

            {showAllowanceForm && hasChildren && (
              <div className="monari-card mt-3 p-4">
                <AllowanceRuleForm childOptions={bundle.children} />
              </div>
            )}

            {!hasChildren ? (
              <div className="monari-card mt-3 p-5 text-center">
                <CircleDollarSign className="mx-auto mb-3 text-[var(--monari-ink-muted)]" size={28} />
                <p className="text-[14px] font-bold text-[var(--monari-ink)]">아이 프로필을 먼저 등록해주세요</p>
                <Link href="/settings" className="mt-2 inline-block text-[13px] font-bold text-[var(--monari-hero)]">
                  설정으로 가기 →
                </Link>
              </div>
            ) : bundle.allowanceRules.length === 0 ? (
              <div className="monari-card mt-3 px-4 py-5 text-center">
                <p className="text-[14px] font-bold text-[var(--monari-ink)]">아직 설정된 용돈이 없어요</p>
                <p className="monari-meta mt-1">위의 새 규칙 버튼으로 추가해보세요</p>
              </div>
            ) : (
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
                    <div key={rule.id} className="monari-card flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--monari-done-bg)] text-[var(--monari-done)]">
                          <CalendarDays size={16} />
                        </span>
                        <div>
                          <p className="text-[14px] font-bold text-[var(--monari-ink)]">
                            {child?.name} · {rule.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-[var(--monari-ink-muted)]">{cycle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-extrabold text-[var(--monari-done)]">{formatWon(rule.amount)}</p>
                        <DeleteAllowanceRuleButton ruleId={rule.id} label={rule.title} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {bundle.allowanceExecutions.filter((e) => e.status === "failed").length > 0 && (
            <section>
              <SectionTitle>미지급 내역</SectionTitle>
              <div className="mt-3 space-y-2">
                {bundle.allowanceExecutions
                  .filter((e) => e.status === "failed")
                  .slice(0, 5)
                  .map((exec) => {
                    const rule = bundle.allowanceRules.find((r) => r.id === exec.allowanceRuleId);
                    const child = bundle.children.find((c) => c.id === rule?.childId);
                    return (
                      <div key={exec.id} className="monari-card flex items-start gap-3 border border-[var(--monari-minus)]/20 p-4">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-[var(--monari-minus)]" />
                        <div>
                          <p className="text-[13px] font-bold text-[var(--monari-ink)]">
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
            </section>
          )}
        </div>
      )}

      {/* Interest tab */}
      {tab === "interest" && (
        <div className="space-y-4">
          {!hasChildren ? (
            <div className="monari-card p-5 text-center">
              <TrendingUp className="mx-auto mb-3 text-[var(--monari-ink-muted)]" size={28} />
              <p className="text-[14px] font-bold text-[var(--monari-ink)]">아이 프로필을 먼저 등록해주세요</p>
              <Link href="/settings" className="mt-2 inline-block text-[13px] font-bold text-[var(--monari-hero)]">
                설정으로 가기 →
              </Link>
            </div>
          ) : (
            <section>
              <SectionTitle>아이별 이자율 설정</SectionTitle>
              <div className="mt-3 space-y-4">
                {bundle.children.map((child) => (
                  <InterestPolicyCard
                    key={child.id}
                    child={child}
                    policy={bundle.interestPolicies.find((p) => p.childId === child.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[14px] bg-[var(--monari-hero-lo)] p-3">
      <p className="text-[11px] text-[var(--monari-hero)]/60 font-semibold">{label}</p>
      <p className="mt-1 text-[14px] font-extrabold text-[var(--monari-hero)]">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--monari-hero)]/50">{sub}</p>}
    </div>
  );
}
