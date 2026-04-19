import { BehaviorLog, BehaviorRule } from "@/lib/types";
import { ChildSectionHeader } from "./child-section-header";

interface ChildStampGridProps {
  logs: BehaviorLog[];
  rules: BehaviorRule[];
}

export function ChildStampGrid({ logs, rules }: ChildStampGridProps) {
  if (logs.length === 0) return null;

  return (
    <section>
      <ChildSectionHeader title="최근 약속 기록" />
      <div className="grid grid-cols-3 gap-2">
        {logs.map((log) => {
          const rule = rules.find((r) => r.id === log.behaviorRuleId);
          const done = log.status === "approved" || log.status === "completed";
          const rejected = log.status === "rejected";
          return (
            <div
              key={log.id}
              className={[
                "flex flex-col items-center gap-1.5 rounded-[18px] border p-3 text-center shadow-[var(--shadow-soft)]",
                done
                  ? "border-[var(--color-stamp-done)]/30 bg-[var(--color-stamp-done-bg)]"
                  : rejected
                    ? "border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 opacity-60"
                    : "border-[var(--color-chip-border)] bg-[var(--color-stamp-pending-bg)]",
              ].join(" ")}
            >
              <span className="text-xl">{done ? "✅" : rejected ? "❌" : "⏳"}</span>
              <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-[var(--color-text)]">
                {rule?.title ?? "약속"}
              </p>
              <p className="text-[10px] text-[var(--color-muted)]">{log.date.slice(5)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
