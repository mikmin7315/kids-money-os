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
  const childId = searchParams.get("childId") || "";

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"weekly" | "monthly" | "manual">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !childId) return;
    setLoading(true);
    setError("");
    try {
      const preset = PRESETS.find((p) => p.type === type)!;
      const result = await createAllowanceRuleAction({
        childId,
        title: "정기 용돈",
        amount: Number(amount),
        type,
        weekday: preset.type === "weekly" ? preset.weekday : undefined,
        dayOfMonth: preset.type === "monthly" ? preset.dayOfMonth : undefined,
      });
      if (result.ok) {
        router.push(`/setup/4?childId=${childId}`);
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
          정기 용돈을 설정해요
        </h1>
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
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min={0}
              step={1000}
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
            <span style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--monari-ink-muted)",
            }}>원</span>
          </div>
          {amount && (
            <p style={{ marginTop: 6, fontSize: 12, color: "var(--monari-hero)", fontWeight: 700 }}>
              {Number(amount).toLocaleString()}원
            </p>
          )}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", display: "block", marginBottom: 8 }}>
            지급 주기
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PRESETS.map((p) => (
              <button
                key={p.type}
                type="button"
                onClick={() => setType(p.type)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  border: `2px solid ${type === p.type ? "var(--monari-hero)" : "var(--monari-line)"}`,
                  borderRadius: 14,
                  background: type === p.type ? "var(--monari-hero-lo)" : "var(--monari-surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
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
          <button
            type="submit"
            disabled={!amount || loading}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: 16,
              fontWeight: 800,
              background: amount ? "var(--monari-hero)" : "var(--monari-line)",
              color: amount ? "#fff" : "var(--monari-ink-muted)",
              border: "none",
              borderRadius: 16,
              cursor: amount ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "저장 중..." : "다음 →"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/setup/4?childId=${childId}`)}
            style={{ background: "none", border: "none", fontSize: 13, color: "var(--monari-ink-muted)", cursor: "pointer", padding: "8px" }}
          >
            건너뛰기
          </button>
        </div>
      </form>
    </main>
  );
}

export default function Setup3Page() {
  return (
    <Suspense>
      <Setup3Inner />
    </Suspense>
  );
}
