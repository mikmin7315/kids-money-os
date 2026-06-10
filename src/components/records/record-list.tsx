import { formatDateLabel, formatWon } from "@/lib/format";
import { BehaviorLog, BehaviorRule, BorrowRequest, MoneyTransaction } from "@/lib/types";

type RecordItem = {
  id: string;
  title: string;
  description: string;
  amount?: number;
  tone: "plus" | "minus" | "pending" | "done";
};

const transactionLabels: Record<MoneyTransaction["type"], string> = {
  allowance: "용돈 받기",
  reward: "약속 보상",
  spend: "지출",
  save: "저축",
  unsave: "저축 인출",
  borrow: "미리쓰기",
  repay: "미리쓰기 상환",
  interest: "이자 받기",
};

const statusLabels: Record<string, string> = {
  pending: "확인 대기",
  completed: "완료",
  approved: "확인 완료",
  rejected: "다시 도전",
  partial: "상환 중",
};

export function RecordList(props: {
  transactions: MoneyTransaction[];
  behaviorLogs: BehaviorLog[];
  behaviorRules: BehaviorRule[];
  borrowRequests: BorrowRequest[];
  childId?: string;
}) {
  const groups = buildGroups(props);

  if (groups.length === 0) {
    return (
      <div className="monari-card px-6 py-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--monari-plus-bg)] text-xl font-800 text-[var(--monari-plus)]" aria-hidden="true">
          ₩
        </div>
        <p className="mt-4 text-[15px] font-800 text-[var(--monari-ink)]">아직 기록이 없어요</p>
        <p className="mx-auto mt-1 max-w-[26ch] text-[13px] leading-5 text-[var(--monari-ink-soft)]">
          용돈, 저축, 약속 활동이 시작되면 날짜별로 자동 정리됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <section key={group.date} className="monari-card overflow-hidden" aria-labelledby={`record-${group.date}`}>
          <div className="flex items-center justify-between border-b border-[var(--monari-line)] px-5 py-4">
            <h3 id={`record-${group.date}`} className="text-[15px] font-800 text-[var(--monari-ink)]">
              {formatDateLabel(group.date)}
            </h3>
            <span className="rounded-full bg-[var(--monari-plus-bg)] px-2.5 py-1 text-[11px] font-700 text-[var(--monari-plus)]">
              {group.items.length}건
            </span>
          </div>
          <div className="divide-y divide-[var(--monari-line)] px-5">
            {group.items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-4">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-800 ${toneClasses(item.tone)}`}
                  aria-hidden="true"
                >
                  {item.tone === "minus" ? "−" : item.tone === "pending" ? "…" : "＋"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-700 text-[var(--monari-ink)]">{item.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-[var(--monari-ink-muted)]">{item.description}</p>
                    </div>
                    {typeof item.amount === "number" && (
                      <p className={`shrink-0 text-[14px] font-800 ${item.tone === "minus" ? "text-[var(--monari-minus)]" : "text-[var(--monari-plus)]"}`}>
                        {item.tone === "minus" ? "−" : "+"}{formatWon(item.amount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function buildGroups(props: {
  transactions: MoneyTransaction[];
  behaviorLogs: BehaviorLog[];
  behaviorRules: BehaviorRule[];
  borrowRequests: BorrowRequest[];
  childId?: string;
}) {
  const filteredTransactions = props.childId
    ? props.transactions.filter((item) => item.childId === props.childId)
    : props.transactions;
  const filteredLogs = props.childId
    ? props.behaviorLogs.filter((item) => item.childId === props.childId)
    : props.behaviorLogs;
  const filteredBorrows = props.childId
    ? props.borrowRequests.filter((item) => item.childId === props.childId)
    : props.borrowRequests;

  const flat: { date: string; item: RecordItem }[] = [
    ...filteredTransactions.map((tx) => ({
      date: tx.date,
      item: {
        id: tx.id,
        title: transactionLabels[tx.type],
        description: tx.memo || "메모 없음",
        amount: tx.amount,
        tone: toneForTx(tx.type),
      },
    })),
    ...filteredLogs.map((log) => ({
      date: log.date,
      item: {
        id: log.id,
        title: props.behaviorRules.find((rule) => rule.id === log.behaviorRuleId)?.title ?? "약속 활동",
        description: statusLabels[log.status] ?? log.status,
        tone: log.status === "pending" ? "pending" as const : "done" as const,
      },
    })),
    ...filteredBorrows.map((borrow) => ({
      date: borrow.createdAt.slice(0, 10),
      item: {
        id: borrow.id,
        title: "미리쓰기 요청",
        description: `${borrow.purpose || "사용 목적 없음"} · ${statusLabels[borrow.status] ?? borrow.status}`,
        amount: borrow.requestedAmount,
        tone: borrow.status === "pending" ? "pending" as const : "minus" as const,
      },
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const grouped = new Map<string, typeof flat>();
  for (const row of flat) {
    const items = grouped.get(row.date) ?? [];
    items.push(row);
    grouped.set(row.date, items);
  }

  return [...grouped.entries()].map(([date, items]) => ({
    date,
    items: items.map((item) => item.item),
  }));
}

function toneForTx(type: MoneyTransaction["type"]) {
  if (type === "spend" || type === "repay" || type === "unsave") return "minus" as const;
  return "plus" as const;
}

function toneClasses(tone: RecordItem["tone"]) {
  if (tone === "minus") return "bg-[var(--monari-minus-bg)] text-[var(--monari-minus)]";
  if (tone === "pending") return "bg-[var(--monari-pending-bg)] text-[var(--monari-pending)]";
  if (tone === "done") return "bg-[var(--monari-done-bg)] text-[var(--monari-done)]";
  return "bg-[var(--monari-plus-bg)] text-[var(--monari-plus)]";
}
