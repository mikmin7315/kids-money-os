"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createAllowanceRuleAction } from "@/actions/management";

const PRESETS = [
  { label: "주 1회", emoji: "📅", type: "weekly" as const, weekday: 6, desc: "토요일 지급" },
  { label: "월 1회", emoji: "🗓️", type: "monthly" as const, dayOfMonth: 1, desc: "매월 1일 지급" },
  { label: "직접 지급", emoji: "✋", type: "manual" as const, desc: "부모가 직접 지급" },
];

function Setup3Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const childIds = (searchParams.get("childIds") || "").split(",").filter(Boolean);
  const childIndex = Number(searchParams.get("childIndex") || "0");
  const childNames = (searchParams.get("childNames") || "").split(",").filter(Boolean);

  const currentChildId = childIds[childIndex] || "";
  const currentChildName = childNames[childIndex] || `아이 ${childIndex + 1}`;
  const isLast = childIndex >= childIds.length - 1;

  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
    setAmount(raw);
    setDisplayAmount(raw ? Number(raw).toLocaleString() : "");
  }
  const [type, setType] = useState<"weekly" | "monthly" | "manual">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = `childIds=${childIds.join(",")}&childNames=${childNames.join(",")}`;

  function goNext() {
    if (isLast) {
      router.push(`/setup/4?${params}&childIndex=0`);
    } else {
      router.push(`/setup/3?${params}&childIndex=${childIndex + 1}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !currentChildId) { goNext(); return; }
    setLoading(true);
    setError("");
    try {
      const preset = PRESETS.find((p) => p.type === type)!;
      const result = await createAllowanceRuleAction({
        childId: currentChildId,
        title: "정기 용돈",
        amount: Number(amount),
        type,
        weekday: preset.type === "weekly" ? preset.weekday : undefined,
        dayOfMonth: preset.type === "monthly" ? preset.dayOfMonth : undefined,
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
        <div style={{ fontSize: 52, marginBottom: 12 }}>💰</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          용돈을 설정해요
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
          얼마나 자주, 얼마씩 줄지 정해보세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", display: "block", marginBottom: 8 }}>
            용돈 금액
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              inputMode="numeric"
              value={displayAmount}
              onChange={handleAmountChange}
              placeholder="0"
              style={{
                width: "100%",
                padding: "14px 48px 14px 16px",
                fontSize: 20,
                fontWeight: 800,
                border: "2px solid var(--monari-line)",
                borderRadius: 14,
                outline: "none",
                background: "var(--monari-surface)",
                color: "var(--monari-ink)",
                boxSizing: "border-box",
              }}
            />
            <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, fontWeight: 700, color: "var(--monari-ink-muted)" }}>원</span>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", display: "block", marginBottom: 8 }}>지급 주기</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PRESETS.map((p) => (
              <button key={p.type} type="button" onClick={() => setType(p.type)}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  border: `2px solid ${type === p.type ? "var(--monari-hero)" : "var(--monari-line)"}`,
                  borderRadius: 14,
                  background: type === p.type ? "var(--monari-hero-lo)" : "var(--monari-surface)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 24 }}>{p.emoji}</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)", margin: 0 }}>{p.label}</p>
                  <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", margin: 0 }}>{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: "var(--monari-minus)", marginBottom: 12 }}>{error}</p>}

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "16px", fontSize: 16, fontWeight: 800,
              background: amount ? "var(--monari-hero)" : "var(--monari-line)",
              color: amount ? "#fff" : "var(--monari-ink-muted)",
              border: "none", borderRadius: 16,
              cursor: "pointer",
            }}>
            {loading ? "저장 중..." : isLast ? "다음 →" : `${childNames[childIndex + 1] || "다음 아이"} 설정 →`}
          </button>
          <button type="button" onClick={goNext}
            style={{ background: "none", border: "none", fontSize: 13, color: "var(--monari-ink-muted)", cursor: "pointer", padding: "8px" }}>
            건너뛰기
          </button>
        </div>
      </form>
    </main>
  );
}

export default function Setup3Page() {
  return <Suspense><Setup3Inner /></Suspense>;
}
