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
      <StatCard label="Cash balance" value={formatWon(props.balance)} hint="Spendable now" />
      <StatCard label="Savings" value={formatWon(props.savings)} hint="Money growing with interest" />
      <StatCard label="Borrowed" value={formatWon(props.borrowed)} hint="Needs to be repaid later" />
      <StatCard label="Interest rate" value={formatPercent(props.interestRate)} hint="Current cycle" />
    </div>
  );
}

export function ChildSummaryList({ summaries }: { summaries: ChildSummary[] }) {
  return (
    <div className="space-y-3">
      {summaries.map((item) => (
        <Link key={item.child.id} href={`/child/${item.child.id}`} className="block">
          <Surface className="transition hover:-translate-y-0.5 hover:bg-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{item.child.name}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">
                  Today tasks {item.todaysBehaviorCount} · Pending {item.pendingApprovals}
                </p>
              </div>
              <Badge tone={item.pendingApprovals ? "amber" : "emerald"}>
                {item.pendingApprovals ? "Needs review" : "Stable"}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <QuickStat label="Balance" value={formatWon(item.wallet.balance)} />
              <QuickStat label="Saved this month" value={formatWon(item.monthReport.totalSave)} />
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
          <p className="text-lg font-semibold">Today tasks</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">This block should be the first thing a child sees.</p>
        </div>
        <TrendingUp className="h-5 w-5 text-[var(--color-accent)]" />
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={`${item.title}-${item.status}`} className="rounded-3xl bg-[var(--color-card)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">Reward {formatWon(item.reward)}</p>
              </div>
              <Badge tone={item.needsApproval ? "amber" : "sky"}>{item.status}</Badge>
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
          <p className="text-lg font-semibold">Recent activity</p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Behavior and money events share one feed.</p>
        </div>
        <Link href="/records" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-text)]">
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {items.slice(0, 8).map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-3xl bg-[var(--color-card)] p-4">
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
    <div className="rounded-3xl bg-[var(--color-card)] p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function accentClass(accent: ActivityItem["accent"]) {
  if (accent === "emerald") return "bg-emerald-500";
  if (accent === "amber") return "bg-amber-500";
  if (accent === "rose") return "bg-rose-500";
  return "bg-sky-500";
}
