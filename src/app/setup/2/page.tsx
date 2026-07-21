"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createChildAction } from "@/actions/management";

export default function Setup2Page() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const age = birthYear ? currentYear - Number(birthYear) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !birthYear) return;
    setLoading(true);
    setError("");
    try {
      const result = await createChildAction({
        name: name.trim(),
        nickname: name.trim(),
        birthYear: Number(birthYear),
      });
      if (result.ok) {
        router.push(`/setup/3?childId=${result.data?.id}`);
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
        <div style={{ fontSize: 52, marginBottom: 12 }}>👶</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          첫 아이를 등록해요
        </h1>
        <p style={{ fontSize: 14, color: "var(--monari-ink-muted)", lineHeight: 1.6 }}>
          아이 이름과 태어난 연도를 입력해주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", display: "block", marginBottom: 8 }}>
            아이 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 지우"
            maxLength={10}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 16,
              fontWeight: 600,
              border: "2px solid var(--monari-line)",
              borderRadius: 14,
              outline: "none",
              background: "var(--monari-surface)",
              color: "var(--monari-ink)",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", display: "block", marginBottom: 8 }}>
            태어난 연도
          </label>
          <input
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="예: 2017"
            min={currentYear - 20}
            max={currentYear}
            style={{
              width: "100%",
              padding: "14px 16px",
              fontSize: 16,
              fontWeight: 600,
              border: "2px solid var(--monari-line)",
              borderRadius: 14,
              outline: "none",
              background: "var(--monari-surface)",
              color: "var(--monari-ink)",
              boxSizing: "border-box",
            }}
          />
          {age !== null && age >= 0 && (
            <p style={{ marginTop: 6, fontSize: 12, color: "var(--monari-hero)", fontWeight: 700 }}>
              만 {age}세
            </p>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "var(--monari-minus)", marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ marginTop: "auto" }}>
          <button
            type="submit"
            disabled={!name.trim() || !birthYear || loading}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: 16,
              fontWeight: 800,
              background: name.trim() && birthYear ? "var(--monari-hero)" : "var(--monari-line)",
              color: name.trim() && birthYear ? "#fff" : "var(--monari-ink-muted)",
              border: "none",
              borderRadius: 16,
              cursor: name.trim() && birthYear ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {loading ? "등록 중..." : "다음 →"}
          </button>
        </div>
      </form>
    </main>
  );
}
