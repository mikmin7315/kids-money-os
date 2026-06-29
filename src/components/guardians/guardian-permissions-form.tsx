"use client";

import { useActionState, useState } from "react";
import { updateGuardianPermissionsAction, removeGuardianAction } from "@/actions/guardians";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

type PermKey = "can_give_allowance" | "can_approve_behavior" | "can_approve_borrow" | "can_change_settings" | "can_invite_guardian";

export function GuardianPermissionsForm({
  guardianId,
  childId,
  permissions,
  permissionDefs,
}: {
  guardianId: string;
  childId: string;
  permissions: Record<PermKey, boolean>;
  permissionDefs: ReadonlyArray<{ key: PermKey; label: string; desc: string }>;
}) {
  const [state, formAction, pending] = useActionState(updateGuardianPermissionsAction, initial);
  const [removeState, removeAction, removePending] = useActionState(removeGuardianAction, initial);
  const [perms, setPerms] = useState<Record<PermKey, boolean>>(permissions);

  return (
    <div className="space-y-4">
      <form action={formAction} className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <input type="hidden" name="guardian_id" value={guardianId} />
        <input type="hidden" name="child_id" value={childId} />
        {(Object.keys(perms) as PermKey[]).map((k) => (
          <input key={k} type="hidden" name={k} value={String(perms[k])} />
        ))}

        <p className="mb-3 text-sm font-extrabold text-[var(--color-text)]">권한 설정</p>

        {state.message && (
          <p className={`mb-3 text-sm font-semibold ${state.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>{state.message}</p>
        )}

        <div className="space-y-3">
          {permissionDefs.map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
                <p className="text-[11px] text-[var(--color-muted)]">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setPerms((p) => ({ ...p, [key]: !p[key] }))}
                className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${perms[key] ? "bg-[var(--color-accent)]" : "bg-[#d1d5db]"}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${perms[key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-[10px] bg-[var(--color-accent)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "저장 중..." : "권한 저장"}
        </button>
      </form>

      {/* 보호자 제거 */}
      <form action={removeAction} className="rounded-[16px] border border-[#fee2e2] bg-white p-4">
        <input type="hidden" name="guardian_id" value={guardianId} />
        <input type="hidden" name="child_id" value={childId} />
        {removeState.message && (
          <p className="mb-2 text-sm font-semibold text-[#dc2626]">{removeState.message}</p>
        )}
        <button
          type="submit"
          disabled={removePending}
          className="w-full rounded-[10px] border border-[#dc2626] py-2.5 text-sm font-bold text-[#dc2626] disabled:opacity-50"
        >
          {removePending ? "처리 중..." : "보호자 제거"}
        </button>
      </form>
    </div>
  );
}
