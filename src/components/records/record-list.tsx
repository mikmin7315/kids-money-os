import { Badge, Surface } from "@/components/ui/primitives";
import { formatDateLabel, formatWon } from "@/lib/format";
import { BehaviorLog, BehaviorRule, BorrowRequest, MoneyTransaction } from "@/lib/types";

type RecordItem = {
  id: string;
  title: string;
  description: string;
  amount?: number;
  tone: "sky" | "emerald" | "amber" | "rose";
};

export function RecordList(props: {
  transactions: MoneyTransaction[];
  behaviorLogs: BehaviorLog[];
  behaviorRules: BehaviorRule[];
  borrowRequests: BorrowRequest[];
  childId?: string;
}) {
  const groups = buildGroups(props);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Surface key={group.date}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{formatDateLabel(group.date)}</h3>
            <Badge>{group.items.length} items</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {group.items.map((item) => (
              <div key={item.id} className="rounded-3xl bg-[var(--color-card)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{item.description}</p>
                  </div>
                  <Badge tone={item.tone}>{typeof item.amount === "number" ? formatWon(item.amount) : "Log"}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Surface>
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
      item: { id: tx.id, title: tx.type, description: tx.memo, amount: tx.amount, tone: toneForTx(tx.type) },
    })),
    ...filteredLogs.map((log) => ({
      date: log.date,
      item: {
        id: log.id,
        title: props.behaviorRules.find((rule) => rule.id === log.behaviorRuleId)?.title ?? "Behavior log",
        description: `Status: ${log.status}`,
        tone: "sky" as const,
      },
    })),
    ...filteredBorrows.map((borrow) => ({
      date: borrow.createdAt.slice(0, 10),
      item: {
        id: borrow.id,
        title: "Borrow request",
        description: `${borrow.purpose} · ${borrow.status}`,
        amount: borrow.requestedAmount,
        tone: "amber" as const,
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
  if (type === "spend" || type === "repay") return "rose" as const;
  if (type === "save" || type === "interest") return "emerald" as const;
  if (type === "borrow") return "amber" as const;
  return "sky" as const;
}
