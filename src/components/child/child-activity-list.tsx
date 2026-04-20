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
    <section
      className="rounded-[24px] bg-white overflow-hidden mb-4"
      style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}
    >
      <div className="px-5 pt-5 pb-2">
        <p className="text-[16px] font-700 text-[#2B2B2B]">최근 거래 내역</p>
      </div>

      {displayed.length === 0 ? (
        <p className="px-5 py-4 text-[14px] text-[rgba(43,43,43,0.55)]">
          최근 거래 내역이 없어요.
        </p>
      ) : (
        <ul className="px-4 pb-3">
          {displayed.map((item, idx) => (
            <li
              key={item.id}
              className={`flex items-center gap-3 py-3 ${
                idx < displayed.length - 1 ? "border-b border-[rgba(43,43,43,0.06)]" : ""
              }`}
            >
              <CategoryIcon type={item.type} title={item.title} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-600 text-[#2B2B2B]">{item.title}</p>
                <p className="mt-0.5 text-[12px] text-[rgba(43,43,43,0.55)]">{item.dateLabel}</p>
              </div>
              <p
                className={`shrink-0 text-[14px] font-700 tabular-nums ${
                  item.rightAccent ? "text-[#C66B3D]" : item.rightLabel.startsWith("-") ? "text-[#2B2B2B]" : "text-[#10367D]"
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
      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-[13px] font-700 ${bg} ${fg}`}
    >
      {symbol}
    </div>
  );
}

function getCategoryStyle(type?: string, title?: string): { bg: string; fg: string; symbol: string } {
  if (type === "spend") {
    const t = title?.toLowerCase() ?? "";
    if (t.includes("편의점") || t.includes("cu") || t.includes("gs") || t.includes("세븐"))
      return { bg: "bg-[#FFF3EC]", fg: "text-[#C66B3D]", symbol: "편" };
    if (t.includes("교통") || t.includes("버스") || t.includes("지하철"))
      return { bg: "bg-[#EEF2FF]", fg: "text-[#10367D]", symbol: "교" };
    if (t.includes("식") || t.includes("밥") || t.includes("과자") || t.includes("간식"))
      return { bg: "bg-[#FFF8F0]", fg: "text-[#A85930]", symbol: "식" };
    return { bg: "bg-[rgba(43,43,43,0.06)]", fg: "text-[#2B2B2B]", symbol: "사" };
  }
  if (type === "allowance") return { bg: "bg-[#EEF2FF]", fg: "text-[#10367D]", symbol: "용" };
  if (type === "reward") return { bg: "bg-[rgba(31,122,77,0.1)]", fg: "text-[#1f7a4d]", symbol: "★" };
  if (type === "save") return { bg: "bg-[#EEF2FF]", fg: "text-[#10367D]", symbol: "저" };
  if (type === "interest") return { bg: "bg-[rgba(31,122,77,0.1)]", fg: "text-[#1f7a4d]", symbol: "이" };
  if (type === "borrow") return { bg: "bg-[#FFF3EC]", fg: "text-[#C66B3D]", symbol: "미" };
  return { bg: "bg-[rgba(43,43,43,0.06)]", fg: "text-[#2B2B2B]", symbol: (title?.[0] ?? "·") };
}
