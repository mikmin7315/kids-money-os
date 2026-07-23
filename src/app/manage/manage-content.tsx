"use client";

import { useState } from "react";
import { AlertCircle, CalendarDays, CircleDollarSign, TrendingUp } from "lucide-react";
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

const PRESETS = [
  { label: "낮음", rate: 2, desc: "처음 시작할 때 추천" },
  { label: "기본", rate: 3, desc: "가장 많이 쓰는 설정" },
  { label: "높음", rate: 5, desc: "약속 잘 지키는 아이" },
];

type Tab = "behaviors" | "allowance" | "interest";

export function ManageContent({ bundle, initialTab = "behaviors" }: { bundle: AppDataBundle; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
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
            className={`flex-1 rounded-[14px] py-2.5 text-[13px] font-700 transition ${
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
            <SectionTitle>현재 약속 목록</SectionTitle>
            {bundle.behaviorRules.length === 0 ? (
              <div className="monari-card mt-3 px-4 py-5 text-center">
                <p className="text-[14px] font-700 text-[var(--monari-ink)]">첫 약속을 만들어 보세요</p>
                <p className="monari-meta mt-1">아래 양식으로 첫 번째 약속을 만들어보세요</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {bundle.behaviorRules.map((rule) => (
                  <div key={rule.id} className="monari-card p-4" style={{ opacity: rule.isActive ? 1 : 0.55 }}>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-[15px] font-800 text-[var(--monari-ink)] leading-tight">{rule.title}</p>
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
                        className={`inline-flex h-[24px] items-center rounded-[8px] px-2.5 text-[11px] font-700 ${
                          rule.requiresParentApproval
                            ? "bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]"
                            : "bg-[var(--monari-done-bg)] text-[var(--monari-done)]"
                        }`}
                      >
                        {rule.requiresParentApproval ? "확인 후 반영" : "자동 반영"}
                      </span>
                      {!rule.isActive && (
                        <span className="inline-flex h-[24px] items-center rounded-[8px] px-2.5 text-[11px] font-700 bg-[var(--monari-surface-soft)] text-[var(--monari-ink-muted)]">
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

          <section>
            <SectionTitle>새 약속 만들기</SectionTitle>
            <div className="monari-card mt-3 p-4">
              <p className="text-[12px] text-[var(--monari-ink-soft)] mb-4">
                보상 금액과 이자율 변화를 같이 설정하면, 약속이 아이의 통장에 바로 연결돼요.
              </p>
              <BehaviorRuleCreateForm />
            </div>
          </section>
        </div>
      )}

      {/* Allowance tab */}
      {tab === "allowance" && (
        <div className="space-y-4">
          {bundle.allowanceRules.length > 0 && (
            <section>
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
                      className="monari-card flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--monari-done-bg)] text-[var(--monari-done)]">
                          <CalendarDays size={16} />
                        </span>
                        <div>
                          <p className="text-[14px] font-700 text-[var(--monari-ink)]">
                            {child?.name} · {rule.title}
                          </p>
                          <p className="mt-0.5 text-[12px] text-[var(--monari-ink-muted)]">{cycle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-800 text-[var(--monari-done)]">{formatWon(rule.amount)}</p>
                        <DeleteAllowanceRuleButton ruleId={rule.id} label={rule.title} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <div className="rounded-[16px] bg-[var(--monari-done-bg)] p-4">
            <p className="text-[12px] font-700 text-[var(--monari-done)]">💡 용돈은 어떻게 지급되나요?</p>
            <ul className="mt-2 space-y-1 text-[12px] leading-5 text-[var(--monari-done)]">
              <li>• 매주·매월 설정한 날에 자동으로 남긴 돈에 더해져요</li>
              <li>• 지급 후 아이에게 알림이 가요</li>
              <li>• 즉시 지급은 아이 통장 페이지에서 할 수 있어요</li>
            </ul>
          </div>

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
                          <p className="text-[13px] font-700 text-[var(--monari-ink)]">
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

          <section>
            <SectionTitle>새 용돈 규칙 추가</SectionTitle>
            {!hasChildren ? (
              <div className="monari-card mt-3 p-5 text-center">
                <CircleDollarSign className="mx-auto mb-3 text-[var(--monari-ink-muted)]" size={28} />
                <p className="text-[14px] font-700 text-[var(--monari-ink)]">아이 프로필을 먼저 등록해주세요</p>
                <Link href="/settings" className="mt-2 inline-block text-[13px] font-700 text-[var(--monari-hero)]">
                  설정으로 가기 →
                </Link>
              </div>
            ) : (
              <div className="monari-card mt-3 p-4">
                <AllowanceRuleForm childOptions={bundle.children} />
              </div>
            )}
          </section>
        </div>
      )}

      {/* Interest tab */}
      {tab === "interest" && (
        <div className="space-y-4">
          <div className="rounded-[16px] bg-[var(--monari-hero-lo)] p-4">
            <p className="text-[12px] font-700 text-[var(--monari-hero)]">📊 이자는 어떻게 계산되나요?</p>
            <div className="mt-2 space-y-1 text-[12px] leading-5 text-[var(--monari-hero)]">
              <p>• <b>기본 이자율</b>로 시작해요</p>
              <p>• 행동 약속을 지킬 때마다 이자율이 올라가요</p>
              <p>• 최소·최대 범위 안에서만 움직여요</p>
              <p>• 매월 말 남긴 돈 × 이자율로 계산해요</p>
            </div>
          </div>

          <section>
            <SectionTitle>이자율 가이드</SectionTitle>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <div key={p.label} className="monari-card p-3 text-center">
                  <p className="text-[20px] font-900 text-[var(--monari-hero)]">{p.rate}%</p>
                  <p className="mt-0.5 text-[12px] font-700 text-[var(--monari-ink)]">{p.label}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--monari-ink-muted)]">{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            {!hasChildren ? (
              <div className="monari-card p-5 text-center">
                <TrendingUp className="mx-auto mb-3 text-[var(--monari-ink-muted)]" size={28} />
                <p className="text-[14px] font-700 text-[var(--monari-ink)]">아이 프로필을 먼저 등록해주세요</p>
                <Link href="/settings" className="mt-2 inline-block text-[13px] font-700 text-[var(--monari-hero)]">
                  설정으로 가기 →
                </Link>
              </div>
            ) : (
              <>
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
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function MetricBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[14px] bg-[var(--monari-hero-lo)] p-3">
      <p className="text-[11px] text-[var(--monari-hero)]/60 font-600">{label}</p>
      <p className="mt-1 text-[14px] font-800 text-[var(--monari-hero)]">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-[var(--monari-hero)]/50">{sub}</p>}
    </div>
  );
}
