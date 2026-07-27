export interface ChildActivityItem {
  id: string;
  title: string;
  dateLabel: string;
  rightLabel: string;
  rightAccent?: boolean;
  type?: string;
}

interface ChildActivityListProps {
  items: ChildActivityItem[];
}

export function ChildActivityList({ items }: ChildActivityListProps) {
  const displayed = items.slice(0, 4);

  return (
    <section className="rounded-[24px] bg-[var(--monari-surface)] overflow-hidden mb-4 shadow-[var(--monari-shadow-md)]">
      <div className="px-5 pt-5 pb-2">
        <p className="text-[16px] font-bold text-[var(--monari-ink)]">최근 거래 내역</p>
      </div>

      {displayed.length === 0 ? (
        <p className="px-5 py-4 text-[14px] text-[var(--monari-ink-soft)]">
          최근 거래 내역이 없어요.
        </p>
      ) : (
        <ul className="px-4 pb-3">
          {displayed.map((item, idx) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 py-3 ${
                idx < displayed.length - 1 ? "border-b border-[var(--monari-border)]" : ""
              }`}
            >
              <CategoryIcon type={item.type} title={item.title} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--monari-ink)]">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-[var(--monari-ink-soft)]">{item.dateLabel}</p>
              </div>
              <p
                className={`shrink-0 text-[14px] font-bold tabular-nums ${
                  item.rightAccent ? "text-[var(--monari-primary-strong)]" : item.rightLabel.startsWith("-") ? "text-[var(--monari-ink)]" : "text-[var(--status-info-solid-text)]"
                }`}
              >
                {item.rightLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CategoryIcon({ type, title }: { type?: string; title: string }) {
  const { bg, fg, symbol } = getCategoryStyle(type, title);
  return (
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold ${bg} ${fg}`}
    >
      {symbol}
    </div>
  );
}

function getCategoryStyle(type?: string, title?: string): { bg: string; fg: string; symbol: string } {
  if (type === "spend") {
    const t = title?.toLowerCase() ?? "";
    if (t.includes("편의점") || t.includes("cu") || t.includes("gs") || t.includes("세븐"))
      return { bg: "bg-[var(--status-pending-solid)]", fg: "text-[var(--monari-primary-strong)]", symbol: "편" };
    if (t.includes("교통") || t.includes("버스") || t.includes("지하철"))
      return { bg: "bg-[var(--status-info-solid)]", fg: "text-[var(--status-info-solid-text)]", symbol: "교" };
    if (t.includes("식") || t.includes("밥") || t.includes("과자") || t.includes("간식"))
      return { bg: "bg-[var(--status-pending-solid)]", fg: "text-[var(--monari-primary-strong)]", symbol: "식" };
    return { bg: "bg-[var(--monari-surface-soft)]", fg: "text-[var(--monari-ink)]", symbol: "사" };
  }
  if (type === "allowance") return { bg: "bg-[var(--status-info-solid)]",    fg: "text-[var(--status-info-solid-text)]",    symbol: "용" };
  if (type === "reward")    return { bg: "bg-[var(--status-success-solid)]",  fg: "text-[var(--status-success-solid-text)]", symbol: "★" };
  if (type === "save")      return { bg: "bg-[var(--status-info-solid)]",    fg: "text-[var(--status-info-solid-text)]",    symbol: "저" };
  if (type === "interest")  return { bg: "bg-[var(--status-success-solid)]",  fg: "text-[var(--status-success-solid-text)]", symbol: "이" };
  if (type === "borrow")    return { bg: "bg-[var(--status-rose-solid)]",     fg: "text-[var(--status-rose-solid-text)]",    symbol: "미" };
  return { bg: "bg-[var(--monari-surface-soft)]", fg: "text-[var(--monari-ink)]", symbol: (title?.[0] ?? "·") };
}
