"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

const EMOJIS = ["🌟", "🐷", "💰", "✨", "🎉", "🪙", "⭐"];

export function StartupSplash() {
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = window.setTimeout(() => setHidden(true), 0);
      return () => window.clearTimeout(t);
    }

    document.body.dataset.startupSplash = "visible";

    const native = Capacitor.isNativePlatform();
    const leaveTimer = window.setTimeout(() => setLeaving(true), native ? 2200 : 1600);
    const hideTimer = window.setTimeout(() => {
      setHidden(true);
      delete document.body.dataset.startupSplash;
    }, native ? 2700 : 2100);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
      delete document.body.dataset.startupSplash;
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`kids-splash${leaving ? " is-leaving" : ""}`}
      role="status"
      aria-label="Monari를 시작하는 중"
    >
      {/* 배경 별들 */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`kids-star kids-star-${i + 1}`} aria-hidden="true">⭐</div>
      ))}

      {/* 메인 캐릭터 영역 */}
      <div className="kids-center" aria-hidden="true">
        {/* 돼지 저금통 */}
        <div className="kids-piggy">🐷</div>

        {/* 코인들 팡팡 */}
        <div className="kids-coin kids-coin-1">🪙</div>
        <div className="kids-coin kids-coin-2">💰</div>
        <div className="kids-coin kids-coin-3">⭐</div>
        <div className="kids-coin kids-coin-4">✨</div>
        <div className="kids-coin kids-coin-5">🎉</div>

        {/* 반짝이는 링 */}
        <div className="kids-ring kids-ring-1" />
        <div className="kids-ring kids-ring-2" />
      </div>

      {/* 텍스트 */}
      <div className="kids-copy">
        <strong>Monari</strong>
        <span>약속을 지키면 이자가 올라가요! 🎯</span>
      </div>
    </div>
  );
}
