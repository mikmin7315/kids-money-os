"use client";

import { useActionState } from "react";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  deleteAllowanceRuleAction,
  deleteInterestPolicyAction,
  deleteBehaviorRuleAction,
  toggleBehaviorRuleAction,
} from "@/actions/management";

type DeleteProps = { ruleId: string; label: string };
type PolicyDeleteProps = { policyId: string; label: string };
type ToggleProps = { ruleId: string; isActive: boolean; label: string };

export function DeleteAllowanceRuleButton({ ruleId, label }: DeleteProps) {
  const [state, action, pending] = useActionState(deleteAllowanceRuleAction, { ok: false, message: "" });

  if (state.ok) return <span className="text-xs font-bold text-[var(--monari-done)]">삭제됨</span>;

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="ruleId" value={ruleId} />
        <button
          type="submit"
          disabled={pending}
          onClick={(e) => {
            if (!window.confirm(`"${label}" 용돈 규칙을 삭제할까요?`)) e.preventDefault();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--status-danger-solid)] text-[var(--status-rose-solid-text)] transition active:scale-90"
          title="삭제"
        >
          <Trash2 size={15} />
        </button>
      </form>
      {state.message && !state.ok && (
        <p className="mt-1 text-[11px] text-[var(--monari-minus)]">{state.message}</p>
      )}
    </div>
  );
}

export function DeleteInterestPolicyButton({ policyId, label }: PolicyDeleteProps) {
  const [state, action, pending] = useActionState(deleteInterestPolicyAction, { ok: false, message: "" });

  if (state.ok) return <span className="text-xs font-bold text-[var(--monari-done)]">삭제됨</span>;

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="policyId" value={policyId} />
        <button
          type="submit"
          disabled={pending}
          onClick={(e) => {
            if (!window.confirm(`"${label}" 이자 정책을 삭제할까요?`)) e.preventDefault();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--status-danger-solid)] text-[var(--status-rose-solid-text)] transition active:scale-90"
          title="삭제"
        >
          <Trash2 size={15} />
        </button>
      </form>
      {state.message && !state.ok && (
        <p className="mt-1 text-[11px] text-[var(--monari-minus)]">{state.message}</p>
      )}
    </div>
  );
}

export function ToggleBehaviorRuleButton({ ruleId, isActive, label }: ToggleProps) {
  const [, action, pending] = useActionState(toggleBehaviorRuleAction, { ok: false, message: "" });

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="ruleId" value={ruleId} />
      <input type="hidden" name="isActive" value={String(isActive)} />
      <button
        type="submit"
        disabled={pending}
        aria-label={`${label} ${isActive ? "비활성화" : "활성화"}`}
        className="flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-xs font-bold transition active:scale-95"
        style={{
          background: isActive ? "var(--status-success-solid)" : "var(--monari-surface-soft)",
          color: isActive ? "var(--monari-done)" : "var(--monari-ink-muted)",
        }}
        title={isActive ? "비활성화" : "활성화"}
      >
        {isActive
          ? <><ToggleRight size={14} /> 활성</>
          : <><ToggleLeft size={14} /> 비활성</>
        }
      </button>
    </form>
  );
}

export function DeleteBehaviorRuleButton({ ruleId, label }: DeleteProps) {
  const [state, action, pending] = useActionState(deleteBehaviorRuleAction, { ok: false, message: "" });

  if (state.ok) return <span className="text-xs font-bold text-[var(--monari-ink-muted)]">삭제됨</span>;

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="ruleId" value={ruleId} />
        <button
          type="submit"
          disabled={pending}
          onClick={(e) => {
            if (!window.confirm(`"${label}" 약속을 삭제할까요? 삭제하면 관련 기록도 사라져요.`)) e.preventDefault();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--status-danger-solid)] text-[var(--status-rose-solid-text)] transition active:scale-90"
          title="삭제"
        >
          <Trash2 size={15} />
        </button>
      </form>
      {state.message && !state.ok && (
        <p className="mt-1 text-[11px] text-[var(--monari-minus)]">{state.message}</p>
      )}
    </div>
  );
}
