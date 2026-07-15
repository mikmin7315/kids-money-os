"use client";

import { useActionState } from "react";
import { createConsentCampaignAction, updateCampaignStatusAction } from "@/actions/admin-reconsent";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function ConsentCampaignCreateForm() {
  const [state, formAction, pending] = useActionState(createConsentCampaignAction, initial);
  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-[14px] border border-[var(--color-border)] p-4">
      <input name="title" placeholder="캠페인 제목" className="w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm" />
      <textarea name="description" placeholder="캠페인 설명 (선택)" rows={2} className="w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm" />
      <select name="terms_type" className="w-full rounded-[8px] border border-[var(--color-border)] px-3 py-2 text-sm">
        <option value="">약관 유형 선택</option>
        <option value="service">서비스 이용약관</option>
        <option value="privacy">개인정보처리방침</option>
        <option value="marketing">마케팅 수신 동의</option>
      </select>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-[var(--color-text-muted)]">유예 기간</span>
          <input name="grace_period_days" type="number" defaultValue={30} min={1} max={365}
            className="w-16 rounded-[8px] border border-[var(--color-border)] px-2 py-1 text-sm" />
          <span className="text-[var(--color-text-muted)]">일</span>
        </label>
        <label className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
          <input type="checkbox" name="block_on_expire" value="true" />
          만료 시 차단
        </label>
      </div>
      {state.message && (
        <p className={`text-[11px] font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="rounded-[8px] bg-[var(--color-accent)] py-2 text-sm font-bold text-white disabled:opacity-50">
        {pending ? "생성 중..." : "캠페인 생성"}
      </button>
    </form>
  );
}

export function CampaignStatusButton({ campaignId, nextStatus, label }: { campaignId: string; nextStatus: string; label: string }) {
  const [state, formAction, pending] = useActionState(updateCampaignStatusAction, initial);
  return (
    <form action={formAction}>
      <input type="hidden" name="campaign_id" value={campaignId} />
      <input type="hidden" name="status" value={nextStatus} />
      {state.message && <p className={`mb-1 text-[10px] ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>}
      <button type="submit" disabled={pending}
        className="rounded-[8px] bg-[var(--color-accent)] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
        {pending ? "..." : label}
      </button>
    </form>
  );
}
