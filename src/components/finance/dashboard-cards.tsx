import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Badge, StatCard, Surface } from "@/components/ui/primitives";
import { formatPercent, formatWon } from "@/lib/format";
import { ActivityItem, ChildSummary } from "@/lib/types";

export function PortfolioGrid(props: {
  balance: number;
  savings: number;
  borrowed: number;
  interestRate: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard label="현금 잔액" value={formatWon(props.balance)} hint="지금 쓸 수 있는 돈" />
      <StatCard label="저축" value={formatWon(props.savings)} hint="이자가 붙는 돈" />
      <StatCard label="빌린 돈" value={formatWon(props.borrowed)} hint="나중에 갚아야 할 돈" />
      <StatCard label="이자율" value={formatPercent(props.interestRate)} hint="현재 이자율" />
    </div>
  );
}

export function ChildSummaryList({ summaries }: { summaries: ChildSummary[] }) {
  return (
    <div className="space-y-3">
      {summaries.map((item) => (
        <Link key={item.child.id} href={`/child/${item.child.id}`} className="block">
          <Surface className="transition hover:-translate-y-0.5 hover:bg-white/95">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-semibold">{item.child.name}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  오늘 행동 {item.todaysBehaviorCount} · 대기 {item.pendingApprovals}
                </p>
              </div>
              <Badge tone={item.pendingApprovals ? "amber" : "emerald"}>
                {item.pendingApprovals ? "검토 필요" : "안정"}
              </Badge>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <QuickStat label="잔액" value={formatWon(item.wallet.balance)} />
              <QuickStat label="이번달 저축" value={formatWon(item.monthReport.totalSave)} />
            </div>
          </Surface>
        </Link>
      ))}
    </div>
  );
}

export function TodaysBehaviorPanel({
  items,
}: {
  items: { title: string; reward: number; status: string; needsApproval: boolean }[];
}) {
  return (
    <Surface>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-semibold">오늘의 행동 약속</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">아이가 가장 먼저 확인하는 화면입니다.</p>
        </div>
        <TrendingUp className="h-5 w-5 text-[var(--color-accent)]" />
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.title}-${item.status}`}
            className="rounded-[24px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(239,228,210,0.92))] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">보상 {formatWon(item.reward)}</p>
              </div>
              <Badge tone={item.needsApproval ? "amber" : "sky"}>{statusLabel(item.status)}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Surface>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-semibold">최근 활동</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">행동과 금융 이벤트를 함께 확인합니다.</p>
        </div>
        <Link href="/records" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-text)]">
          전체 보기
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {items.slice(0, 8).map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-[24px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.66),rgba(249,243,234,0.92))] p-4"
          >
            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${accentClass(item.accent)}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{item.title}</p>
                {typeof item.amount === "number" ? <p className="shrink-0 text-sm font-semibold">{formatWon(item.amount)}</p> : null}
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{item.description}</p>
              <p className="mt-2 text-xs text-[var(--color-soft)]">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-[rgba(87,70,49,0.08)] bg-[var(--color-card-2)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-3 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}

function statusLabel(status: string) {
  if (status === "pending") return "대기";
  if (status === "approved") return "승인";
  if (status === "completed") return "완료";
  if (status === "rejected") return "반려";
  return status;
}

function accentClass(accent: ActivityItem["accent"]) {
  if (accent === "emerald") return "bg-emerald-500";
  if (accent === "amber") return "bg-amber-500";
  if (accent === "rose") return "bg-rose-500";
  return "bg-sky-500";
}
