"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateRegionAction } from "@/actions/management";

export function RegionForm({ currentRegion, regions }: { currentRegion: string | null; regions: string[] }) {
  const [selected, setSelected] = useState<string | null>(currentRegion);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function handleSelect(region: string) {
    setSelected((prev) => (prev === region ? null : region));
    setMessage(null);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateRegionAction(selected);
      if (result.ok) {
        setMessage("저장되었어요.");
        router.refresh();
      } else {
        setMessage(result.error ?? "저장 실패");
      }
    });
  }

  const hasChanged = selected !== currentRegion;

  return (
    <div className="space-y-3">
      <div className="monari-card divide-y divide-[var(--monari-line)]">
        {regions.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => handleSelect(r)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition active:scale-[0.99]"
          >
            <span
              className="text-[14px] font-semibold"
              style={{ color: selected === r ? "var(--monari-hero)" : "var(--monari-ink)" }}
            >
              {r}
            </span>
            {selected === r && <Check size={17} className="text-[var(--monari-hero)] shrink-0" />}
          </button>
        ))}

        {selected && (
          <button
            type="button"
            onClick={() => { setSelected(null); setMessage(null); }}
            className="flex w-full items-center px-4 py-3.5 text-left"
          >
            <span className="text-[13px] text-[var(--monari-ink-muted)]">지역 정보 삭제</span>
          </button>
        )}
      </div>

      {hasChanged && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          className="w-full rounded-[14px] bg-[var(--monari-hero)] py-3.5 text-[15px] font-black text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? "저장 중…" : "저장하기"}
        </button>
      )}

      {message && (
        <p className="text-center text-[13px] font-semibold text-[var(--monari-hero)]">{message}</p>
      )}
    </div>
  );
}
