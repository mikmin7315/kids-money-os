"use client";

import { formatWon } from "@/lib/format";

export function SpendVsSaveSplit({ spend, save }: { spend: number; save: number }) {
  const total = Math.max(spend + save, 1);
  const saveRatio = (save / total) * 100;
  const spendRatio = (spend / total) * 100;

  const r = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * r;
  const spendDash = (spend / total) * circumference;
  const saveDash = (save / total) * circumference;
  const saveOffset = -spendDash;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[15px] font-800 text-[var(--monari-ink)]">지출과 저금 비율</p>
        <p className="monari-meta mt-1">사용한 돈과 모은 돈의 균형을 한눈에 볼 수 있어요.</p>
      </div>

      <div className="flex items-center gap-5">
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          role="img"
          aria-label={`지출 ${spendRatio.toFixed(0)}%, 저금 ${saveRatio.toFixed(0)}%`}
        >
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--monari-line)" strokeWidth="16" />
          {spend > 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--monari-minus)"
              strokeWidth="16"
              strokeDasharray={`${spendDash} ${circumference - spendDash}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="butt"
            />
          )}
          {save > 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="var(--monari-done)"
              strokeWidth="16"
              strokeDasharray={`${saveDash} ${circumference - saveDash}`}
              strokeDashoffset={circumference * 0.25 + saveOffset}
              strokeLinecap="butt"
            />
          )}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            style={{ fontSize: 18, fontWeight: 900, fill: "var(--monari-ink)" }}
          >
            {saveRatio.toFixed(0)}%
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            style={{ fontSize: 10, fontWeight: 600, fill: "var(--monari-ink-muted)" }}
          >
            저금률
          </text>
        </svg>

        <div className="flex-1 space-y-3">
          <LegendRow icon="💸" label="지출" value={formatWon(spend)} ratio={spendRatio} tone="rose" />
          <LegendRow icon="🌱" label="저금" value={formatWon(save)} ratio={saveRatio} tone="emerald" />
        </div>
      </div>
    </div>
  );
}

export function ReportBarGroup({
  allowance,
  spend,
  save,
  borrowed,
}: {
  allowance: number;
  spend: number;
  save: number;
  borrowed: number;
}) {
  const max = Math.max(allowance, spend, save, borrowed, 1);

  return (
    <div className="space-y-5" role="img" aria-label="용돈, 지출, 저금, 빌린 돈 항목별 비교">
      <div>
        <p className="text-[15px] font-800 text-[var(--monari-ink)]">돈의 흐름 비교</p>
        <p className="monari-meta mt-1">가장 큰 항목을 기준으로 금액 차이를 비교해요.</p>
      </div>
      <MetricBar label="용돈" emoji="💰" value={allowance} max={max} tone="sky" />
      <MetricBar label="지출" emoji="💸" value={spend} max={max} tone="rose" />
      <MetricBar label="저금" emoji="🌱" value={save} max={max} tone="emerald" />
      <MetricBar label="빌린 돈" emoji="🤝" value={borrowed} max={max} tone="amber" />
    </div>
  );
}

export function BehaviorRing({ rate }: { rate: number }) {
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const normalizedRate = Math.min(Math.max(rate, 0), 100);
  const filled = (normalizedRate / 100) * circumference;
  const color =
    normalizedRate >= 80
      ? "var(--monari-done)"
      : normalizedRate >= 50
        ? "var(--monari-hero)"
        : "var(--monari-pending)";
  const label =
    normalizedRate >= 80 ? "아주 잘하고 있어요! 🎉" : normalizedRate >= 50 ? "좋아지고 있어요" : "다음엔 더 해볼까요?";

  return (
    <div className="flex items-center gap-5">
      <svg
        width="104"
        height="104"
        viewBox="0 0 104 104"
        role="img"
        aria-label={`약속 달성률 ${normalizedRate.toFixed(1)}%`}
      >
        <circle cx="52" cy="52" r={r} fill="none" stroke="var(--monari-line)" strokeWidth="10" />
        <circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference * 0.25}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="52" y="48" textAnchor="middle" style={{ fontSize: 20, fontWeight: 900, fill: "var(--monari-ink)" }}>
          {normalizedRate.toFixed(0)}%
        </text>
        <text x="52" y="66" textAnchor="middle" style={{ fontSize: 9, fontWeight: 700, fill: "var(--monari-ink-muted)" }}>
          달성률
        </text>
      </svg>
      <div className="flex-1">
        <p className="text-[15px] font-800" style={{ color }}>
          {label}
        </p>
        <p className="mt-1 text-[12px] leading-5 text-[var(--monari-ink-soft)]">
          약속을 잘 지킬수록
          <br />
          이자 보너스가 올라가요.
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--monari-line)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${normalizedRate}%`, background: color, transition: "width 0.6s ease" }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricBar({
  label,
  emoji,
  value,
  max,
  tone,
}: {
  label: string;
  emoji: string;
  value: number;
  max: number;
  tone: "sky" | "rose" | "emerald" | "amber";
}) {
  const pct = Math.round((value / max) * 100);
  const barColor =
    tone === "rose"
      ? "var(--monari-minus)"
      : tone === "emerald"
        ? "var(--monari-done)"
        : tone === "amber"
          ? "var(--monari-pending)"
          : "var(--monari-plus)";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-700 text-[var(--monari-ink-soft)]">
          <span>{emoji}</span>
          {label}
        </span>
        <span className="font-800 tabular-nums text-[var(--monari-ink)]">{formatWon(value)}</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-[var(--monari-line)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: barColor, transition: "width 0.5s ease" }}
        />
        {pct > 15 && (
          <span
            className="absolute right-0 top-0 flex h-full items-center pr-1.5 text-[9px] font-800 text-white"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
}

function LegendRow({
  icon,
  label,
  value,
  ratio,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  ratio: number;
  tone: "rose" | "emerald";
}) {
  const color = tone === "rose" ? "var(--monari-minus)" : "var(--monari-done)";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-700 text-[var(--monari-ink-muted)]">
          <span>{icon}</span>
          {label}
        </span>
        <span className="text-[12px] font-800 tabular-nums" style={{ color }}>
          {ratio.toFixed(0)}%
        </span>
      </div>
      <p className="text-[16px] font-900 tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
