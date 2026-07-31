"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin } from "lucide-react";
import { updateRegionAction } from "@/actions/management";
import { REGIONS } from "@/lib/regions";

export function CompleteFlow({ currentRegion }: { currentRegion: string | null }) {
  const [step, setStep] = useState<"welcome" | "region" | "done">("welcome");
  const [selected, setSelected] = useState<string | null>(currentRegion);
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();

  function handleRegionSave() {
    setSaveError(null);
    startTransition(async () => {
      if (selected !== currentRegion) {
        const result = await updateRegionAction(selected);
        if (!result.ok) {
          setSaveError("지역 저장에 실패했어요. 다시 시도해 주세요.");
          return;
        }
      }
      router.push("/children/new");
    });
  }

  function handleSkip() {
    router.push("/children/new");
  }

  if (step === "welcome") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 pb-12 pt-16 text-center">
        <div
          className="mb-8 flex h-24 w-24 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}
        >
          <span style={{ fontSize: 44 }}>🎉</span>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "var(--monari-ink)",
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
            marginBottom: 12,
          }}
        >
          Monari에 오신 걸<br />환영해요!
        </h1>

        <p style={{ fontSize: 15, color: "var(--monari-ink-muted)", lineHeight: 1.75, maxWidth: 280 }}>
          이제 아이의 첫 금융 교육을 시작할 준비가 됐어요.
        </p>

        {/* 단계 표시 */}
        <div className="mt-8 flex items-center gap-2">
          <span className="h-2 w-6 rounded-full" style={{ background: "var(--monari-hero)" }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--monari-line-strong)" }} />
        </div>

        <div className="mt-8 w-full max-w-xs">
          <button
            type="button"
            onClick={() => setStep("region")}
            className="block w-full rounded-[16px] py-4 text-[16px] font-extrabold text-white transition active:scale-[0.97]"
            style={{ background: "var(--monari-hero)" }}
          >
            시작하기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-dvh flex-col px-5 pb-12 pt-14">
      {/* 헤더 */}
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "var(--monari-hero-lo)" }}
        >
          <MapPin size={22} style={{ color: "var(--monari-hero)" }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.02em" }}>
          거주 지역을 알려주세요
        </h2>
        <p style={{ fontSize: 13, color: "var(--monari-ink-muted)", marginTop: 6, lineHeight: 1.6 }}>
          같은 지역 또래와 용돈·저축을 비교할 수 있어요.<br />나중에 설정에서 변경할 수 있어요.
        </p>
      </div>

      {/* 단계 표시 */}
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: "var(--monari-line-strong)" }} />
        <span className="h-2 w-6 rounded-full" style={{ background: "var(--monari-hero)" }} />
      </div>

      {/* 지역 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="rounded-[18px] divide-y" style={{ background: "var(--monari-surface)", border: "1px solid var(--monari-line)" }}>
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelected((prev) => (prev === r ? null : r))}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left transition active:scale-[0.99]"
            >
              <span
                className="text-[14px] font-semibold"
                style={{ color: selected === r ? "var(--monari-hero)" : "var(--monari-ink)" }}
              >
                {r}
              </span>
              {selected === r && <Check size={17} style={{ color: "var(--monari-hero)", flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="mt-5 space-y-2.5">
        {saveError && (
          <p className="rounded-[12px] bg-[var(--status-danger-solid)] px-4 py-3 text-[13px] font-semibold text-[var(--status-rose-solid-text)]">
            {saveError}
          </p>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={handleRegionSave}
          className="w-full rounded-[14px] py-4 text-[15px] font-black text-white transition active:scale-[0.98] disabled:opacity-60"
          style={{ background: selected ? "var(--monari-hero)" : "var(--monari-line-strong)" }}
        >
          {isPending ? "저장 중…" : selected ? "저장하고 계속" : "선택하고 계속"}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="w-full rounded-[14px] py-3.5 text-[14px] font-bold transition active:scale-[0.98]"
          style={{ color: "var(--monari-ink-muted)", background: "var(--monari-surface-soft)" }}
        >
          건너뛰기
        </button>
      </div>
    </main>
  );
}
