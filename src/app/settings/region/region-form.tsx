"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { updateRegionAction } from "@/actions/management";
import { getSigungusForSido, getDongsForSigungu } from "@/lib/region-loader";
import type { RegionEntry } from "@/lib/region-loader";

interface Props {
  currentRegion: string | null;
  currentSigungu: string | null;
  currentDong: string | null;
  regions: readonly string[];
}

function Spinner() {
  return (
    <div className="flex justify-center py-6">
      <svg
        className="animate-spin"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--monari-hero)"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    </div>
  );
}

function RowButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-4 text-left transition active:scale-[0.99]"
    >
      <span
        className="flex-1 truncate text-[14px] font-semibold"
        style={{ color: selected ? "var(--monari-hero)" : "var(--monari-ink)" }}
      >
        {label}
      </span>
      {selected && <Check size={17} className="text-[var(--monari-hero)] shrink-0" />}
    </button>
  );
}

export function RegionForm({ currentRegion, currentSigungu, currentDong, regions }: Props) {
  const [sido, setSido] = useState<string | null>(currentRegion);
  const [sigunguName, setSigunguName] = useState<string | null>(currentSigungu);
  const [dongName, setDongName] = useState<string | null>(currentDong);

  const [sigungus, setSigungus] = useState<RegionEntry[]>([]);
  const [dongs, setDongs] = useState<string[]>([]);
  const [loadingLevel, setLoadingLevel] = useState<"sigungu" | "dong" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const dongFetchToken = useRef(0);

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  // Load initial data if the user already has a selection
  useEffect(() => {
    if (!currentRegion) return;
    setLoadingLevel("sigungu");
    getSigungusForSido(currentRegion).then(async (result) => {
      setSigungus(result);
      if (currentSigungu) {
        const entry = result.find((e) => e.name.trim().normalize() === currentSigungu.trim().normalize());
        if (entry && currentDong) {
          setLoadingLevel("dong");
          const dongResult = await getDongsForSigungu(entry.code);
          setDongs(dongResult);
        }
      }
      setLoadingLevel(null);
    }).catch(() => setLoadingLevel(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSigungus = useCallback(async (newSido: string) => {
    setLoadingLevel("sigungu");
    setLoadError(null);
    try {
      const result = await getSigungusForSido(newSido);
      setSigungus(result);
    } catch {
      setLoadError("시/군/구 목록을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setLoadingLevel(null);
    }
  }, []);

  const fetchDongs = useCallback(async (sigungCode: string) => {
    // Serial token: ignore responses from superseded requests
    const token = ++dongFetchToken.current;
    setLoadingLevel("dong");
    setLoadError(null);
    try {
      const result = await getDongsForSigungu(sigungCode);
      if (token !== dongFetchToken.current) return;
      setDongs(result);
    } catch {
      if (token !== dongFetchToken.current) return;
      setLoadError("읍/면/동 목록을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      if (token === dongFetchToken.current) setLoadingLevel(null);
    }
  }, []);

  function handleSidoSelect(r: string) {
    const next = r === sido ? null : r;
    setSido(next);
    setSigunguName(null);
    setDongName(null);
    setSigungus([]);
    setDongs([]);
    setMessage(null);
    if (next) fetchSigungus(next);
  }

  function handleSigungSelect(entry: RegionEntry) {
    const next = entry.name === sigunguName ? null : entry.name;
    setSigunguName(next);
    setDongName(null);
    setDongs([]);
    setMessage(null);
    if (next) fetchDongs(entry.code);
  }

  function handleDongSelect(name: string) {
    setDongName((prev) => (prev === name ? null : name));
    setMessage(null);
  }

  function handleClear() {
    setSido(null);
    setSigunguName(null);
    setDongName(null);
    setSigungus([]);
    setDongs([]);
    setMessage(null);
  }

  const hasChanged =
    sido !== currentRegion ||
    sigunguName !== (currentSigungu ?? null) ||
    dongName !== (currentDong ?? null);

  function handleSave() {
    startTransition(async () => {
      const result = await updateRegionAction(sido, sigunguName, dongName);
      if (result.ok) {
        setMessage("저장되었어요.");
        router.refresh();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(result.error ?? "저장 실패");
      }
    });
  }

  const anySelected = sido || sigunguName || dongName;

  return (
    <div className="space-y-5">
      {/* ── 시/도 ── */}
      <div>
        <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--monari-ink-muted)]">
          시 · 도
        </p>
        <div className="monari-card divide-y divide-[var(--monari-line)]">
          {regions.map((r) => (
            <RowButton
              key={r}
              label={r}
              selected={sido === r}
              onClick={() => handleSidoSelect(r)}
            />
          ))}
        </div>
      </div>

      {/* ── 시/군/구 ── */}
      {sido && (
        <div>
          <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--monari-ink-muted)]">
            시 · 군 · 구
          </p>
          <div className="monari-card divide-y divide-[var(--monari-line)] max-h-72 overflow-y-auto">
            {loadingLevel === "sigungu" ? (
              <Spinner />
            ) : sigungus.length === 0 ? (
              <p className="px-4 py-4 text-[13px] text-[var(--monari-ink-muted)]">
                데이터 없음
              </p>
            ) : (
              sigungus.map((e) => (
                <RowButton
                  key={e.code}
                  label={e.name}
                  selected={sigunguName === e.name}
                  onClick={() => handleSigungSelect(e)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── 읍/면/동 ── */}
      {sigunguName && (
        <div>
          <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wider text-[var(--monari-ink-muted)]">
            읍 · 면 · 동
          </p>
          <div className="monari-card divide-y divide-[var(--monari-line)] max-h-72 overflow-y-auto">
            {loadingLevel === "dong" ? (
              <Spinner />
            ) : dongs.length === 0 ? (
              <p className="px-4 py-4 text-[13px] text-[var(--monari-ink-muted)]">
                데이터 없음
              </p>
            ) : (
              dongs.map((name) => (
                <RowButton
                  key={name}
                  label={name}
                  selected={dongName === name}
                  onClick={() => handleDongSelect(name)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* ── 삭제 ── */}
      {anySelected && (
        <button
          type="button"
          onClick={handleClear}
          className="w-full rounded-[14px] border border-[var(--monari-line)] py-3.5 text-[13px] font-semibold text-[var(--monari-ink-muted)] transition active:scale-[0.98]"
        >
          지역 정보 삭제
        </button>
      )}

      {/* ── 저장 ── */}
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

      {loadError && (
        <p className="text-center text-[13px] font-semibold text-red-500">
          {loadError}
        </p>
      )}

      {message && (
        <p className="text-center text-[13px] font-semibold text-[var(--monari-hero)]">
          {message}
        </p>
      )}
    </div>
  );
}
