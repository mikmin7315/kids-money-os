"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Capacitor } from "@capacitor/core";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppPrompt() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setHidden(sessionStorage.getItem("monari-install-prompt-hidden") === "true");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!promptEvent || hidden) return null;

  async function install() {
    await promptEvent?.prompt();
    const choice = await promptEvent?.userChoice;
    if (choice?.outcome === "accepted") setPromptEvent(null);
  }

  function dismiss() {
    sessionStorage.setItem("monari-install-prompt-hidden", "true");
    setHidden(true);
  }

  return (
    <aside className="fixed inset-x-3 bottom-[calc(82px+env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-[416px] items-center gap-3 rounded-[24px] border border-[var(--monari-line)] bg-white p-3 shadow-[var(--monari-shadow-float)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#25273a] text-white">
        <Download className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-800 text-[var(--monari-ink)]">Monari 앱 설치</p>
        <p className="mt-0.5 text-[11px] text-[var(--monari-ink-muted)]">홈 화면에서 더 빠르게 시작하세요.</p>
      </div>
      <button type="button" onClick={install} className="h-9 shrink-0 rounded-[12px] bg-[var(--monari-hero)] px-3 text-[12px] font-700 text-white">
        설치
      </button>
      <button type="button" onClick={dismiss} aria-label="설치 안내 닫기" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--monari-ink-muted)]">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
