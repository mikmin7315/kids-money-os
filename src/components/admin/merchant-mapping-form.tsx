"use client";

import { useActionState } from "react";
import { addMerchantMappingAction, deleteMerchantMappingAction } from "@/actions/admin-ops";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function MerchantMappingAddForm() {
  const [state, formAction, pending] = useActionState(addMerchantMappingAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-[14px] border border-[var(--color-border)] p-4">
      <input
        name="merchant_pattern"
        placeholder="가맹점 패턴 (예: 스타벅스, GS25)"
        className="w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      <input
        name="category"
        placeholder="카테고리 (예: cafe, convenience)"
        className="w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm"
      />
      {state.message && (
        <p className={`text-[11px] font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="rounded-[8px] bg-[var(--color-accent)] py-2 text-sm font-bold text-white disabled:opacity-50">
        {pending ? "추가 중..." : "매핑 추가"}
      </button>
    </form>
  );
}

export function MerchantMappingDeleteButton({ mappingId }: { mappingId: string }) {
  const [state, formAction, pending] = useActionState(deleteMerchantMappingAction, initial);
  return (
    <form action={formAction}>
      <input type="hidden" name="mapping_id" value={mappingId} />
      {state.message && !state.ok && <p className="mb-1 text-[10px] text-[var(--monari-minus)]">{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-[8px] bg-[var(--status-danger-solid)] px-2.5 py-1 text-[11px] font-bold text-[var(--status-danger-solid-text)] disabled:opacity-50">
        삭제
      </button>
    </form>
  );
}
