"use client";

import { useEffect, useState } from "react";

export function StartupSplash() {
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    document.body.dataset.startupSplash = "visible";

    const leaveTimer = window.setTimeout(() => setLeaving(true), 1250);
    const hideTimer = window.setTimeout(() => {
      setHidden(true);
      delete document.body.dataset.startupSplash;
    }, 1650);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
      delete document.body.dataset.startupSplash;
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`monari-startup-splash${leaving ? " is-leaving" : ""}`}
      role="status"
      aria-label="Monari를 시작하는 중"
    >
      <div className="monari-startup-glow" aria-hidden="true" />
      <div className="monari-startup-stage" aria-hidden="true">
        <div className="monari-startup-orbit monari-startup-orbit-one" />
        <div className="monari-startup-orbit monari-startup-orbit-two" />

        <div className="monari-startup-card">
          <div className="monari-startup-mark">
            <span>M</span>
            <i />
          </div>
          <div className="monari-startup-card-lines">
            <span />
            <span />
          </div>
          <div className="monari-startup-balance">+ ₩</div>
        </div>

        <div className="monari-startup-coin">
          <span>₩</span>
        </div>
        <div className="monari-startup-spark spark-one" />
        <div className="monari-startup-spark spark-two" />
        <div className="monari-startup-spark spark-three" />
      </div>

      <div className="monari-startup-copy">
        <strong>Monari</strong>
        <span>우리 가족의 좋은 돈 습관</span>
      </div>
    </div>
  );
}
