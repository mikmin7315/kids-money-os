"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBehaviorRuleAction } from "@/actions/management";

const QUICK_PRESETS = [
  { title: "숙제하기", description: "매일 숙제를 스스로 해요", rewardAmount: 500, interestDelta: 0.5 },
  { title: "방 청소하기", description: "방을 깨끗하게 정리해요", rewardAmount: 300, interestDelta: 0.3 },
  { title: "책 읽기", description: "하루 30분 이상 책을 읽어요", rewardAmount: 400, interestDelta: 0.4 },
  { title: "운동하기", description: "매일 30분 운동해요", rewardAmount: 500, interestDelta: 0.5 },
];

function Setup5Inner() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggle(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0) { router.push("/setup/complete"); return; }
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(
        [...selected].map((idx) => {
          const p = QUICK_PRESETS[idx];
          return createBehaviorRuleAction({
            title: p.title,
            description: p.description,
            rewardAmount: p.rewardAmount,
            interestDelta: p.interestDelta,
            ruleCategory: "recurring",
            monthlyTargetRate: 80,
            requiresParentApproval: false,
          });
        }),
      );
      if (results.some((r) => !r.ok)) throw new Error("일부 약속 저장에 실패했어요.");
      router.push("/setup/complete");
    } catch {
      setError("약속 저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-8">
      <div className="mb-8">
        <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          행동 약속을 정해요
        </h1>
        <p style={{ fontSize: 14, color: "var(--monari-ink-muted)", lineHeight: 1.6 }}>
          약속을 지키면 보상금과 이자율이 올라가요.<br />
          나중에 더 추가할 수 있어요.
        </p>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {QUICK_PRESETS.map((p, idx) => {
            const isOn = selected.has(idx);
            return (
              <button
                key={p.title}
                type="button"
                onClick={() => toggle(idx)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  border: `2px solid ${isOn ? "var(--monari-hero)" : "var(--monari-line)"}`,
                  borderRadius: 14,
                  background: isOn ? "var(--monari-hero-lo)" : "var(--monari-surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `2px solid ${isOn ? "var(--monari-hero)" : "var(--monari-line-strong)"}`,
                    background: isOn ? "var(--monari-hero)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {isOn && <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)", margin: 0 }}>{p.title}</p>
                  <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", margin: 0 }}>{p.description}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--monari-hero)", margin: 0, whiteSpace: "nowrap" }}>
                    이자율 +{p.interestDelta}%
                  </p>
                  <p style={{ fontSize: 11, color: "var(--monari-ink-muted)", margin: 0, whiteSpace: "nowrap" }}>
                    보상 +{p.rewardAmount.toLocaleString()}원
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {error && (
          <p style={{ fontSize: 13, color: "var(--monari-minus)", fontWeight: 600, textAlign: "center" }}>{error}</p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: 16,
            fontWeight: 800,
            background: "var(--monari-hero)",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            cursor: "pointer",
          }}
        >
          {loading ? "저장 중..." : selected.size > 0 ? `${selected.size}개 추가하고 완료 →` : "완료 →"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/setup/complete")}
          style={{ background: "none", border: "none", fontSize: 13, color: "var(--monari-ink-muted)", cursor: "pointer", padding: "8px" }}
        >
          건너뛰기
        </button>
      </div>
    </main>
  );
}

export default function Setup5Client() {
  return <Setup5Inner />;
}
