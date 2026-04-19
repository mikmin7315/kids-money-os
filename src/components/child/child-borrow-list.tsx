import { BorrowRequest } from "@/lib/types";
import { formatWon } from "@/lib/format";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending: { label: "대기 중", cls: "bg-[var(--color-warn)]/10 text-[var(--color-warn)]" },
  approved: { label: "승인됨", cls: "bg-[var(--color-success)]/10 text-[var(--color-success)]" },
  rejected: { label: "반려됨", cls: "bg-[var(--color-danger)]/10 text-[var(--color-danger)]" },
};

export function ChildBorrowList({ borrows }: { borrows: BorrowRequest[] }) {
  if (borrows.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {borrows.map((b) => {
        const { label, cls } = STATUS_MAP[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-500" };
        return (
          <div key={b.id} className="flex items-center justify-between rounded-[16px] border border-[var(--color-chip-border)]/60 bg-[linear-gradient(180deg,rgba(255,253,248,0.96),rgba(255,242,203,0.9))] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{b.purpose}</p>
              <p className="text-xs text-[var(--color-muted)]">{formatWon(b.requestedAmount)}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
