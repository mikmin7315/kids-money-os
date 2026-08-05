"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createChildAction, deleteChildAction } from "@/actions/management";
import { Plus, Trash2 } from "lucide-react";

type AddedChild = { id: string; name: string; birthYear: number };

const STORAGE_KEY = "setup2_children";

export default function Setup2Page() {
  const router = useRouter();
  const [children, setChildren] = useState<AddedChild[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as AddedChild[]) : [];
    } catch { return []; }
  });
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(true);

  const currentYear = new Date().getFullYear();
  const age = birthYear ? currentYear - Number(birthYear) : null;

  async function handleAddChild(e: React.FormEvent) {
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
      if (result.ok && result.data?.id) {
        const newChild = { id: result.data!.id, name: name.trim(), birthYear: Number(birthYear) };
        setChildren((prev) => {
          const next = [...prev, newChild];
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
        setName("");
        setBirthYear("");
        setShowForm(false);
      } else {
        setError(result.error || "오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (children.length === 0) return;
    const childIds = children.map((c) => c.id).join(",");
    const childNames = children.map((c) => encodeURIComponent(c.name)).join(",");
    router.push(`/setup/3?childIds=${childIds}&childNames=${childNames}&childIndex=0`);
  }

  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-8">
      <div className="mb-8">
        <div style={{ fontSize: 52, marginBottom: 12 }}>👶</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", marginBottom: 6 }}>
          아이를 등록해요
        </h1>
        <p style={{ fontSize: 14, color: "var(--monari-ink-muted)", lineHeight: 1.6 }}>
          여러 명도 등록할 수 있어요.
        </p>
      </div>

      {/* 등록된 아이 목록 */}
      {children.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {children.map((c, i) => (
            <div key={c.id} style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              background: "var(--monari-hero-lo)",
              border: "2px solid var(--monari-hero)",
              borderRadius: 14,
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 22, marginRight: 12 }}>
                {["🐣", "🐥", "🐤", "🐦"][i % 4]}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--monari-ink)", margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 12, color: "var(--monari-ink-muted)", margin: 0 }}>
                  {currentYear - c.birthYear}세 ({c.birthYear}년생)
                </p>
              </div>
              <button
                onClick={async () => {
                  setDeletingId(c.id);
                  setError("");
                  const result = await deleteChildAction(c.id);
                  setDeletingId(null);
                  if (result.ok) {
                    setChildren((prev) => {
                      const next = prev.filter((_, j) => j !== i);
                      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                      return next;
                    });
                  } else {
                    setError("아이 삭제에 실패했어요. 다시 시도해 주세요.");
                  }
                }}
                disabled={deletingId === c.id}
                aria-label={`${c.name} 삭제`}
                style={{ background: "none", border: "none", cursor: deletingId === c.id ? "wait" : "pointer", padding: "12px 8px", opacity: deletingId === c.id ? 0.4 : 1 }}
              >
                <Trash2 size={16} color="var(--monari-minus)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 아이 추가 폼 */}
      {showForm && (
        <form onSubmit={handleAddChild} style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", display: "block", marginBottom: 6 }}>
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 지우"
              maxLength={10}
              autoFocus
              style={{
                width: "100%",
                padding: "13px 16px",
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
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", display: "block", marginBottom: 6 }}>
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
                padding: "13px 16px",
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
              <p style={{ marginTop: 4, fontSize: 12, color: "var(--monari-hero)", fontWeight: 700 }}>만 {age}세</p>
            )}
          </div>
          {error && <p style={{ fontSize: 13, color: "var(--monari-minus)", marginBottom: 10 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            {children.length > 0 && (
              <button
                type="button"
                onClick={() => { setShowForm(false); setName(""); setBirthYear(""); setError(""); }}
                style={{
                  flex: 1,
                  padding: "13px",
                  fontSize: 14,
                  fontWeight: 700,
                  background: "var(--monari-surface)",
                  color: "var(--monari-ink-muted)",
                  border: "2px solid var(--monari-line)",
                  borderRadius: 14,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
            )}
            <button
              type="submit"
              disabled={!name.trim() || !birthYear || loading}
              style={{
                flex: 2,
                padding: "13px",
                fontSize: 15,
                fontWeight: 800,
                background: name.trim() && birthYear ? "var(--monari-hero)" : "var(--monari-line)",
                color: name.trim() && birthYear ? "#fff" : "var(--monari-ink-muted)",
                border: "none",
                borderRadius: 14,
                cursor: name.trim() && birthYear ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "등록 중..." : "아이 추가"}
            </button>
          </div>
        </form>
      )}

      {/* 아이 한 명 더 추가 버튼 */}
      {showForm && children.length > 0 ? (
        <button
          type="button"
          disabled
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "11px",
            fontSize: 13,
            fontWeight: 700,
            background: "transparent",
            color: "var(--monari-ink-muted)",
            border: "2px dashed var(--monari-line)",
            borderRadius: 14,
            cursor: "default",
            marginBottom: 20,
            opacity: 0.5,
          }}
        >
          <Plus size={14} /> 아이 한 명 더 추가 (이 아이를 먼저 등록해주세요)
        </button>
      ) : !showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "13px",
            fontSize: 14,
            fontWeight: 700,
            background: "var(--monari-surface)",
            color: "var(--monari-ink-muted)",
            border: "2px dashed var(--monari-line-strong)",
            borderRadius: 14,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          <Plus size={16} /> 아이 한 명 더 추가
        </button>
      ) : null}

      <div style={{ marginTop: "auto" }}>
        <button
          onClick={handleNext}
          disabled={children.length === 0}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: 16,
            fontWeight: 800,
            background: children.length > 0 ? "var(--monari-hero)" : "var(--monari-line)",
            color: children.length > 0 ? "#fff" : "var(--monari-ink-muted)",
            border: "none",
            borderRadius: 16,
            cursor: children.length > 0 ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {children.length > 0
            ? `${children.length}명 등록 완료, 다음 →`
            : "아이를 먼저 추가해주세요"}
        </button>
      </div>
    </main>
  );
}
