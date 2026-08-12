"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { upsertInterestPolicyAction } from "@/actions/management";

const PRESETS = [
  { label: "낮음", rate: 2, emoji: "🌱", desc: "처음 시작할 때 추천" },
  { label: "기본", rate: 3, emoji: "⭐", desc: "가장 많이 쓰는 설정" },
  { label: "높음", rate: 5, emoji: "🚀", desc: "약속 잘 지키는 아이" },
];

function getStorageKey(childId: string) {
  return `setup4_rate_${childId}`;
}

function Setup4Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childIds = (searchParams.get("childIds") || "").split(",").filter(Boolean);
  const childIndex = Number(searchParams.get("childIndex") || "0");
  const childNames = (searchParams.get("childNames") || "").split(",").filter(Boolean);

  const currentChildId = childIds[childIndex] || "";
  const currentChildName = childNames[childIndex] || `아이 ${childIndex + 1}`;
  const isLast = childIndex >= childIds.length - 1;

  const savedRate = (() => {
    try { return Number(sessionStorage.getItem(getStorageKey(currentChildId)) || "3"); }
    catch { return 3; }
  })();

  const [rate, setRateState] = useState(savedRate);
  const [customMode, setCustomMode] = useState(
    !PRESETS.some((p) => p.rate === savedRate)
  );
  const [customInput, setCustomInput] = useState(
    !PRESETS.some((p) => p.rate === savedRate) ? String(savedRate) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customError, setCustomError] = useState("");

  const params = `childIds=${childIds.join(",")}&childNames=${childNames.join(",")}`;

  function setRate(r: number) {
    setRateState(r);
    try { sessionStorage.setItem(getStorageKey(currentChildId), String(r)); } catch {}
  }

  function handlePreset(r: number) {
    setCustomMode(false);
    setCustomInput("");
    setRate(r);
  }

  function handleCustomInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    setCustomInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 30) {
      setRate(parsed);
      setCustomError("");
    } else if (val !== "" && !isNaN(parsed)) {
      setCustomError("이자율은 0.1%~30% 사이로 입력해주세요.");
    } else {
      setCustomError("");
    }
  }

  function goNext() {
    if (isLast) {
      router.push(`/setup/5?${params}`);
    } else {
      router.push(`/setup/4?${params}&childIndex=${childIndex + 1}`);
    }
  }

  async function handleSubmit() {
    if (!currentChildId) { goNext(); return; }
    setLoading(true);
    setError("");
    try {
      const result = await upsertInterestPolicyAction({
        childId: currentChildId,
        baseInterestRate: rate,
        minInterestRate: Math.max(0, rate - 2),
        maxInterestRate: rate + 3,
        settlementCycle: "monthly",
      });
      if (result.ok) {
        goNext();
      } else {
        setError(result.error || "오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  const activePreset = PRESETS.find((p) => p.rate === rate && !customMode);

  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-8">
      <div className="mb-8">
        <div style={{ fontSize: 52, marginBottom: 12 }}>📈</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          이자율을 정해요
        </h1>
        {childIds.length > 1 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--monari-hero-lo)", borderRadius: 10, padding: "4px 12px", marginBottom: 8,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-hero)" }}>
              {currentChildName} ({childIndex + 1}/{childIds.length})
            </span>
          </div>
        )}
        <p style={{ fontSize: 14, color: "var(--monari-ink-muted)", lineHeight: 1.6 }}>
          저금한 돈에 붙는 이자예요.<br />
          약속을 잘 지키면 이자율이 올라가요!
        </p>
      </div>

      <div style={{ flex: 1 }}>
        {/* 프리셋 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
          {PRESETS.map((p) => {
            const active = !customMode && activePreset?.rate === p.rate;
            return (
              <button key={p.rate} type="button" onClick={() => handlePreset(p.rate)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                  border: `2px solid ${active ? "var(--monari-hero)" : "var(--monari-line)"}`,
                  borderRadius: 16,
                  background: active ? "var(--monari-hero-lo)" : "var(--monari-surface)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 28 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)", margin: 0 }}>{p.label}</p>
                  <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", margin: 0 }}>{p.desc}</p>
                </div>
                <span style={{ fontSize: 20, fontWeight: 900, color: active ? "var(--monari-hero)" : "var(--monari-ink-muted)" }}>
                  {p.rate}%
                </span>
              </button>
            );
          })}
        </div>

        {/* 직접 입력 토글 */}
        <button
          type="button"
          onClick={() => { setCustomMode(true); setCustomInput(String(rate)); }}
          style={{
            width: "100%", marginBottom: 16, padding: "12px 16px",
            border: `2px solid ${customMode ? "var(--monari-hero)" : "var(--monari-line)"}`,
            borderRadius: 14,
            background: customMode ? "var(--monari-hero-lo)" : "var(--monari-surface)",
            cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>✏️</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink)", margin: 0 }}>직접 입력</p>
              <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", margin: 0 }}>0.1% 단위로 설정 가능</p>
            </div>
          </div>
          {customMode && (
            <span style={{ fontSize: 18, fontWeight: 900, color: "var(--monari-hero)" }}>{rate}%</span>
          )}
        </button>

        {customMode && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              type="text"
              inputMode="decimal"
              value={customInput}
              onChange={handleCustomInput}
              placeholder="예: 4.5"
              autoFocus
              style={{
                width: "100%",
                padding: "14px 48px 14px 16px",
                fontSize: 22,
                fontWeight: 800,
                border: "2px solid var(--monari-hero)",
                borderRadius: 14,
                outline: "none",
                background: "var(--monari-surface)",
                color: "var(--monari-ink)",
                boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18, fontWeight: 700, color: "var(--monari-hero)" }}>%</span>
          </div>
        )}
        {customMode && customError && (
          <p style={{ fontSize: 12, color: "var(--monari-minus)", marginBottom: 12, marginTop: -8 }}>{customError}</p>
        )}

        {/* 이자율 범위 안내 */}
        <div style={{
          background: "var(--monari-surface)", border: "1px solid var(--monari-line)",
          borderRadius: 14, padding: "14px 16px",
        }}>
          <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", margin: "0 0 4px" }}>이자율 범위</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink)", margin: 0 }}>
            최소 {Math.max(0, rate - 2)}% ~ 기본 {rate}% ~ 최대 {rate + 3}%
          </p>
          <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", margin: "4px 0 0" }}>
            행동 약속 달성률에 따라 자동 조정
          </p>
        </div>
      </div>

      {error && <p style={{ fontSize: 13, color: "var(--monari-minus)", marginBottom: 12 }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
        <button type="button" onClick={handleSubmit} disabled={loading || Boolean(customError) || (customMode && isNaN(parseFloat(customInput)))}
          style={{
            width: "100%", padding: "16px", fontSize: 16, fontWeight: 800,
            background: "var(--monari-hero)", color: "#fff",
            border: "none", borderRadius: 16, cursor: "pointer",
          }}>
          {loading ? "저장 중..." : isLast ? "다음 →" : `${childNames[childIndex + 1] || "다음 아이"} 설정 →`}
        </button>
        <button type="button" onClick={goNext}
          style={{ background: "none", border: "none", fontSize: 13, color: "var(--monari-ink-muted)", cursor: "pointer", padding: "8px" }}>
          건너뛰기
        </button>
      </div>
    </main>
  );
}

export default function Setup4Client() {
  return <Suspense><Setup4Inner /></Suspense>;
}
