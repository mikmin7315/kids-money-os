"use client";

import { useActionState } from "react";
import { updateAppConfigAction } from "@/actions/admin-policy";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function AppConfigForm({ configKey, currentValue }: { configKey: string; currentValue: string }) {
  const [state, formAction, pending] = useActionState(updateAppConfigAction, initial);
  return (
    <form action={formAction} className="flex gap-2">
      <input type="hidden" name="key" value={configKey} />
      <input
        name="value"
        defaultValue={currentValue}
        className="flex-1 rounded-[8px] border border-[var(--color-border)] px-2 py-1.5 font-mono text-xs"
      />
      {state.message && (
        <p className={`self-center text-[11px] font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>
          {state.ok ? "✓" : "✗"}
        </p>
      )}
      <button type="submit" disabled={pending} className="rounded-[8px] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
        {pending ? "..." : "저장"}
      </button>
    </form>
  );
}
