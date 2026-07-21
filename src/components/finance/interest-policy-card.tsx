"use client";

import { useActionState, useState } from "react";
import { TrendingUp } from "lucide-react";
import { upsertInterestPolicyForm, type ManagementFormState } from "@/actions/management";
import { DeleteInterestPolicyButton } from "@/components/finance/delete-rule-button";
import type { ChildProfile, InterestPolicy } from "@/lib/types";

const initialState: ManagementFormState = { ok: false, message: "" };
const presets = [
  { label: "차근차근", min: 1, base: 2, max: 4 },
  { label: "균형 있게", min: 1, base: 3, max: 7 },
  { label: "도전 크게", min: 2, base: 5, max: 10 },
] as const;

export function InterestPolicyCard({ child, policy }: { child: ChildProfile; policy?: InterestPolicy }) {
  const [state, action, pending] = useActionState(upsertInterestPolicyForm, initialState);
  const [minRate, setMinRate] = useState(policy?.minInterestRate ?? 1);
  const [baseRate, setBaseRate] = useState(policy?.baseInterestRate ?? 3);
  const [maxRate, setMaxRate] = useState(policy?.maxInterestRate ?? 7);

  const applyPreset = (preset: (typeof presets)[number]) => {
    setMinRate(preset.min);
    setBaseRate(preset.base);
    setMaxRate(preset.max);
  };

  return (
    <article className="overflow-hidden rounded-[24px] bg-white shadow-[var(--monari-shadow-md)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--monari-line)] p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
            <TrendingUp size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-[var(--monari-ink)]">{child.name}</h3>
            <p className="text-xs text-[var(--monari-ink-muted)]">
              최소 {formatRate(minRate)} · 기본 {formatRate(baseRate)} · 최대 {formatRate(maxRate)}
            </p>
          </div>
        </div>
        {policy && <DeleteInterestPolicyButton policyId={policy.id} label={`${child.name} 이자 정책`} />}
      </div>

      <form action={action} className="space-y-5 p-5">
        <input type="hidden" name="childId" value={child.id} />
        <input type="hidden" name="minInterestRate" value={minRate} />
        <input type="hidden" name="baseInterestRate" value={baseRate} />
        <input type="hidden" name="maxInterestRate" value={maxRate} />

        <fieldset>
          <legend className="mb-2 text-xs font-bold text-[var(--monari-ink-soft)]">빠른 선택</legend>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset) => {
              const selected = minRate === preset.min && baseRate === preset.base && maxRate === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => applyPreset(preset)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition ${selected ? "border-[var(--monari-hero)] bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]" : "border-[var(--monari-line)] text-[var(--monari-ink-soft)]"}`}
                >
                  <span className="block text-xs font-extrabold">{preset.label}</span>
                  <span className="mt-0.5 block text-[10px]">{preset.min}·{preset.base}·{preset.max}%</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-4">
          <RateSlider label="최소 이자율" value={minRate} min={0} max={baseRate} onChange={(value) => setMinRate(Math.min(value, baseRate))} />
          <RateSlider label="기본 이자율" value={baseRate} min={minRate} max={maxRate} onChange={(value) => setBaseRate(Math.max(minRate, Math.min(value, maxRate)))} emphasized />
          <RateSlider label="최대 이자율" value={maxRate} min={baseRate} max={20} onChange={(value) => setMaxRate(Math.max(value, baseRate))} />
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-[var(--monari-ink-soft)]">정산 주기</span>
          <select name="settlementCycle" className="monari-input" defaultValue={policy?.settlementCycle ?? "monthly"}>
            <option value="monthly">매월 정산</option>
            <option value="weekly">매주 정산</option>
          </select>
        </label>

        <button type="submit" disabled={pending} className="monari-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
          {pending ? "저장 중..." : policy ? "이자율 변경 저장" : "이자율 설정 저장"}
        </button>
        {state.message && (
          <p role="status" aria-live="polite" className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${state.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {state.message}
          </p>
        )}
      </form>
    </article>
  );
}

function RateSlider({ label, value, min, max, onChange, emphasized = false }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void; emphasized?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-[var(--monari-ink-soft)]">{label}</span>
        <output className={`font-black ${emphasized ? "text-lg text-[var(--monari-hero)]" : "text-sm text-[var(--monari-ink)]"}`}>{formatRate(value)}</output>
      </span>
      <input type="range" value={value} min={min} max={max} step={0.5} onChange={(event) => onChange(Number(event.target.value))} className="h-2 w-full cursor-pointer accent-[var(--monari-hero)]" />
    </label>
  );
}

function formatRate(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}
