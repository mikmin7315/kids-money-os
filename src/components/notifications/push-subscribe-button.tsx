"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { subscribePushAction, unsubscribePushAction } from "@/actions/push-subscriptions";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushSubscribeButton() {
  const [state, setState] = useState<"loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setState(sub ? "subscribed" : "unsubscribed")),
    );
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (state === "subscribed") {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await unsubscribePushAction(sub.endpoint);
        }
        setState("unsubscribed");
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") { setState("denied"); return; }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
        const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        await subscribePushAction(json);
        setState("subscribed");
      }
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;
  if (state === "unsupported") return null;

  return (
    <div className="mb-6 rounded-[20px] border border-[var(--monari-line)] bg-[var(--monari-surface)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
            {state === "subscribed" ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-[14px] font-800 text-[var(--monari-ink)]">기기 푸시 알림</p>
            <p className="text-[12px] text-[var(--monari-ink-muted)]">
              {state === "subscribed" ? "이 기기에서 알림을 받고 있어요" :
               state === "denied" ? "브라우저에서 알림이 차단됐어요" :
               "앱을 닫아도 알림을 받을 수 있어요"}
            </p>
          </div>
        </div>
        {state !== "denied" && (
          <button
            type="button"
            onClick={toggle}
            disabled={busy}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              state === "subscribed" ? "bg-[var(--monari-hero)]" : "bg-[var(--monari-line-strong)]"
            }`}
            aria-label={state === "subscribed" ? "푸시 알림 끄기" : "푸시 알림 켜기"}
          >
            {busy ? (
              <Loader2 className="absolute left-1/2 h-4 w-4 -translate-x-1/2 animate-spin text-white" />
            ) : (
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                state === "subscribed" ? "translate-x-6" : "translate-x-1"
              }`} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
