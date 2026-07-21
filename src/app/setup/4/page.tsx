"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { upsertInterestPolicyAction } from "@/actions/management";

const PRESETS = [
  { label: "낮음", rate: 2, emoji: "🌱", desc: "처음 시작할 때 추천" },
  { label: "기본", rate: 3, emoji: "⭐", desc: "가장 많이 쓰는 설정" },
  { label: "높음", rate: 5, emoji: "🚀", desc: "약속 잘 지키는 아이" },
];

function Setup4Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childIds = (searchParams.get("childIds") || "").split(",").filter(Boolean);
  const childIndex = Number(searchParams.get("childIndex") || "0");
  const childNames = (searchParams.get("childNames") || "").split(",").filter(Boolean);

  const currentChildId = childIds[childIndex] || "";
  const currentChildName = childNames[childIndex] || `아이 ${childIndex + 1}`;
  const isLast = childIndex >= childIds.length - 1;

  const [rate, setRate] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = `childIds=${childIds.join(",")}&childNames=${childNames.join(",")}`;

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

  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-8">
      <div className="mb-8">
        <div style={{ fontSize: 52, marginBottom: 12 }}>📈</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          이자율을 정해요
        </h1>
        {childIds.length > 1 && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--monari-hero-lo)",
            borderRadius: 10,
            padding: "4px 12px",
            marginBottom: 8,
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {PRESETS.map((p) => (
            <button key={p.rate} type="button" onClick={() => setRate(p.rate)}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "16px 18px",
                border: `2px solid ${rate === p.rate ? "var(--monari-hero)" : "var(--monari-line)"}`,
                borderRadius: 16,
                background: rate === p.rate ? "var(--monari-hero-lo)" : "var(--monari-surface)",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}>
              <span style={{ fontSize: 28 }}>{p.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)", margin: 0 }}>{p.label}</p>
                <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", margin: 0 }}>{p.desc}</p>
              </div>
              <span style={{ fontSize: 20, fontWeight: 900, color: rate === p.rate ? "var(--monari-hero)" : "var(--monari-ink-muted)" }}>
                {p.rate}%
              </span>
            </button>
          ))}
        </div>

        <div style={{
          background: "var(--monari-surface)",
          border: "1px solid var(--monari-line)",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 24,
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

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" onClick={handleSubmit} disabled={loading}
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

export default function Setup4Page() {
  return <Suspense><Setup4Inner /></Suspense>;
}
