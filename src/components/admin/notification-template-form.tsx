"use client";

import { useActionState } from "react";
import { updateNotificationTemplateAction } from "@/actions/notification-settings";

type State = { ok: boolean; message: string };
const initial: State = { ok: false, message: "" };

export function NotificationTemplateForm({
  notifType,
  titleTemplate,
  bodyTemplate,
  isActive,
}: {
  notifType: string;
  titleTemplate: string;
  bodyTemplate: string;
  isActive: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateNotificationTemplateAction, initial);
  return (
    <form action={formAction} className="space-y-2 rounded-[14px] border border-[var(--color-border)] p-4">
      <input type="hidden" name="notif_type" value={notifType} />
      <p className="text-xs font-bold text-[var(--color-text)]">{notifType}</p>
      <input
        name="title_template"
        defaultValue={titleTemplate}
        className="w-full rounded-[8px] border border-[var(--color-border)] px-2 py-1.5 text-xs"
        placeholder="제목"
      />
      <textarea
        name="body_template"
        defaultValue={bodyTemplate}
        rows={2}
        className="w-full rounded-[8px] border border-[var(--color-border)] px-2 py-1.5 text-xs"
        placeholder="본문"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
          <input type="checkbox" name="is_active" value="true" defaultChecked={isActive} />
          사용 중
        </label>
        {state.message && (
          <p className={`text-[11px] font-semibold ${state.ok ? "text-[var(--monari-done)]" : "text-[var(--monari-minus)]"}`}>{state.message}</p>
        )}
        <button type="submit" disabled={pending} className="rounded-[8px] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          {pending ? "..." : "저장"}
        </button>
      </div>
    </form>
  );
}
