"use client";

import { useActionState } from "react";

type ToggleAction = (prev: { ok: boolean; message: string }, formData: FormData) => Promise<{ ok: boolean; message: string }>;

function ToggleRow({
  notifType,
  label,
  enabled,
  action,
}: {
  notifType: string;
  label: string;
  enabled: boolean;
  action: ToggleAction;
}) {
  const [, formAction, pending] = useActionState(action, { ok: false, message: "" });
  return (
    <form action={formAction} className="flex items-center justify-between rounded-[14px] bg-white px-4 py-3 shadow-[var(--monari-shadow-md)]">
      <input type="hidden" name="notif_type" value={notifType} />
      <input type="hidden" name="enabled" value={String(!enabled)} />
      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink)" }}>{label}</p>
      <button
        type="submit"
        disabled={pending}
        className="relative h-6 w-11 rounded-full transition disabled:opacity-50"
        style={{ backgroundColor: enabled ? "var(--monari-hero)" : "#e5e7eb" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition"
          style={{ left: enabled ? 22 : 2 }}
        />
      </button>
    </form>
  );
}

export function NotificationToggleList({
  items,
  preferences,
  action,
}: {
  items: { type: string; label: string }[];
  preferences: Record<string, boolean>;
  action: ToggleAction;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ToggleRow
          key={item.type}
          notifType={item.type}
          label={item.label}
          enabled={preferences[item.type] !== false}
          action={action}
        />
      ))}
    </div>
  );
}
