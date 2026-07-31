"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteAllowanceRuleAction, { ok: false, message: "" });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router]);

  if (state.ok) return <span className="text-xs font-bold text-[var(--monari-done)]">삭제됨</span>;

  return (
    <div>
      {confirming ? (
        <div className="flex items-center gap-1.5">
          <form action={action}>
            <input type="hidden" name="ruleId" value={ruleId} />
            <button type="submit" disabled={pending} className="h-7 rounded-lg bg-rose-500 px-2.5 text-[11px] font-bold text-white transition active:scale-90">
              {pending ? "…" : "삭제"}
            </button>
          </form>
          <button type="button" onClick={() => setConfirming(false)} className="h-7 rounded-lg bg-[var(--monari-surface-soft)] px-2.5 text-[11px] font-bold text-[var(--monari-ink-muted)] transition active:scale-90">
            취소
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--status-danger-solid)] text-[var(--status-rose-solid-text)] transition active:scale-90"
          title="삭제"
        >
          <Trash2 size={15} />
        </button>
      )}
      {state.message && !state.ok && (
        <p className="mt-1 text-[11px] text-[var(--monari-minus)]">{state.message}</p>
      )}
    </div>
  );
}

export function DeleteInterestPolicyButton({ policyId, label }: PolicyDeleteProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteInterestPolicyAction, { ok: false, message: "" });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router]);

  if (state.ok) return <span className="text-xs font-bold text-[var(--monari-done)]">삭제됨</span>;

  return (
    <div>
      {confirming ? (
        <div className="flex items-center gap-1.5">
          <form action={action}>
            <input type="hidden" name="policyId" value={policyId} />
            <button type="submit" disabled={pending} className="h-7 rounded-lg bg-rose-500 px-2.5 text-[11px] font-bold text-white transition active:scale-90">
              {pending ? "…" : "삭제"}
            </button>
          </form>
          <button type="button" onClick={() => setConfirming(false)} className="h-7 rounded-lg bg-[var(--monari-surface-soft)] px-2.5 text-[11px] font-bold text-[var(--monari-ink-muted)] transition active:scale-90">
            취소
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--status-danger-solid)] text-[var(--status-rose-solid-text)] transition active:scale-90"
          title="삭제"
        >
          <Trash2 size={15} />
        </button>
      )}
      {state.message && !state.ok && (
        <p className="mt-1 text-[11px] text-[var(--monari-minus)]">{state.message}</p>
      )}
    </div>
  );
}

export function ToggleBehaviorRuleButton({ ruleId, isActive, label }: ToggleProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(toggleBehaviorRuleAction, { ok: false, message: "" });

  useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router]);

  return (
    <div>
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
          {pending
            ? <span className="text-[10px]">처리중…</span>
            : isActive
              ? <><ToggleRight size={14} /> 활성</>
              : <><ToggleLeft size={14} /> 비활성</>
          }
        </button>
      </form>
      {state.message && !state.ok && (
        <p className="mt-1 text-[11px] text-[var(--monari-minus)]">{state.message}</p>
      )}
    </div>
  );
}

export function DeleteBehaviorRuleButton({ ruleId, label }: DeleteProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteBehaviorRuleAction, { ok: false, message: "" });
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { if (state.ok) router.refresh(); }, [state.ok, router]);

  if (state.ok) return <span className="text-xs font-bold text-[var(--monari-ink-muted)]">삭제됨</span>;

  return (
    <div>
      {confirming ? (
        <div className="flex items-center gap-1.5">
          <form action={action}>
            <input type="hidden" name="ruleId" value={ruleId} />
            <button type="submit" disabled={pending} className="h-7 rounded-lg bg-rose-500 px-2.5 text-[11px] font-bold text-white transition active:scale-90">
              {pending ? "…" : "삭제"}
            </button>
          </form>
          <button type="button" onClick={() => setConfirming(false)} className="h-7 rounded-lg bg-[var(--monari-surface-soft)] px-2.5 text-[11px] font-bold text-[var(--monari-ink-muted)] transition active:scale-90">
            취소
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--status-danger-solid)] text-[var(--status-rose-solid-text)] transition active:scale-90"
          title="삭제"
        >
          <Trash2 size={15} />
        </button>
      )}
      {state.message && !state.ok && (
        <p className="mt-1 text-[11px] text-[var(--monari-minus)]">{state.message}</p>
      )}
    </div>
  );
}
