"use client";

import { useState } from "react";

export function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined") return "default";
    return "Notification" in window ? Notification.permission : "unsupported";
  });

  async function requestPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  if (permission === "granted") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-[16px] bg-[var(--status-success-solid)] px-4 py-3">
        <span style={{ fontSize: 20 }}>✅</span>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--status-success-solid-text)" }}>알림이 허용되어 있어요.</p>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="mb-6 rounded-[16px] bg-[var(--status-danger-solid)] px-4 py-3">
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--status-danger-solid-text)" }}>🔕 알림이 차단되어 있어요</p>
        <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 4, lineHeight: 1.6 }}>
          브라우저 설정 → 알림에서 이 사이트의 알림을 허용으로 변경해주세요.
        </p>
      </div>
    );
  }

  if (permission === "unsupported") {
    return (
      <div className="mb-6 rounded-[16px] bg-[var(--monari-surface-soft)] px-4 py-3">
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)" }}>이 환경에서는 푸시 알림이 지원되지 않아요.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-[16px] bg-[var(--monari-hero-lo)] px-4 py-4">
      <p style={{ fontSize: 14, fontWeight: 800, color: "var(--monari-hero)" }}>🔔 알림을 허용해주세요</p>
      <p style={{ fontSize: 12, color: "var(--monari-hero)", marginTop: 4, lineHeight: 1.65, marginBottom: 12 }}>
        약속 승인, 상환 알림 등 중요한 소식을 바로 받을 수 있어요.
      </p>
      <button
        onClick={requestPermission}
        className="w-full rounded-[10px] bg-[var(--monari-hero)] py-2.5 text-sm font-bold text-white"
      >
        알림 허용하기
      </button>
    </div>
  );
}
