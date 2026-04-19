export interface ChildActivityItem {
  id: string;
  title: string;
  dateLabel: string;
  rightLabel: string;
  rightAccent?: boolean;
}

interface ChildActivityListProps {
  items: ChildActivityItem[];
}

export function ChildActivityList({ items }: ChildActivityListProps) {
  const displayed = items.slice(0, 4);

  return (
    <section>
      <h2 className="mb-3 text-[18px] font-bold text-[#2B2B2B]">최근 활동</h2>
      <div
        className="overflow-hidden rounded-[24px] bg-white"
        style={{ boxShadow: "0 8px 24px rgba(43,43,43,0.06)" }}
      >
        {displayed.length === 0 ? (
          <p className="px-5 py-6 text-[14px] text-[rgba(43,43,43,0.55)]">
            최근 활동이 없어요.
          </p>
        ) : (
          <ul>
            {displayed.map((item, idx) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-4 px-5 py-4 ${
                  idx < displayed.length - 1
                    ? "border-b border-[rgba(43,43,43,0.06)]"
                    : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#2B2B2B]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-[rgba(43,43,43,0.55)]">
                    {item.dateLabel}
                  </p>
                </div>
                <p
                  className={`shrink-0 text-[14px] font-bold tabular-nums ${
                    item.rightAccent
                      ? "text-[#C66B3D]"
                      : "text-[rgba(43,43,43,0.72)]"
                  }`}
                >
                  {item.rightLabel}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
