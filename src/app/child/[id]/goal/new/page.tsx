"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createGoalAction } from "@/actions/goals";

const EMOJIS = ["🎯", "🚲", "🎮", "📱", "🎸", "⚽", "🎓", "✈️", "🐶", "🎨", "📚", "🏊"];

export default function NewGoalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = parseInt(targetAmount.replace(/[^0-9]/g, ""), 10);
    if (!title.trim()) { setError("목표 이름을 입력해주세요."); return; }
    if (isNaN(amount) || amount < 100) { setError("목표 금액을 올바르게 입력해주세요."); return; }

    startTransition(async () => {
      const result = await createGoalAction({
        childId: id,
        title,
        targetAmount: amount,
        deadline: deadline || null,
        emoji,
      });
      if (!result.ok) { setError(result.error ?? "저장에 실패했어요."); return; }
      router.push(`/child/${id}/goal`);
    });
  }

  return (
    <div style={{ background: "#E0F2FE", minHeight: "100dvh" }}>
      <main className="px-4 pb-16 pt-8">
        <Link
          href={`/child/${id}/goal`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold"
          style={{ color: "#0EA5E9" }}
        >
          <ArrowLeft size={16} /> 목표 저금통
        </Link>

        <div className="mb-6">
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0C4B78", letterSpacing: "-0.03em" }}>
            새 목표 만들기
          </h1>
          <p style={{ fontSize: 13, color: "#64B5D9", marginTop: 4 }}>아이와 함께 정해보세요!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 이모지 선택 */}
          <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(14,165,233,0.10)]">
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0C4B78", marginBottom: 12 }}>아이콘</p>
            <div className="grid grid-cols-6 gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className="flex h-11 w-full items-center justify-center rounded-[12px] text-2xl transition active:scale-90"
                  style={{
                    background: emoji === e ? "rgba(14,165,233,0.15)" : "rgba(14,165,233,0.05)",
                    border: emoji === e ? "2px solid #0EA5E9" : "2px solid transparent",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* 목표 이름 */}
          <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(14,165,233,0.10)]">
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0C4B78", display: "block", marginBottom: 10 }}>
              목표 이름 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 자전거, 게임기, 여행 저금"
              maxLength={30}
              className="w-full rounded-[12px] border px-4 py-3 text-sm outline-none"
              style={{
                border: "1.5px solid rgba(14,165,233,0.25)",
                background: "rgba(14,165,233,0.03)",
                color: "#0C4B78",
              }}
            />
          </div>

          {/* 목표 금액 */}
          <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(14,165,233,0.10)]">
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0C4B78", display: "block", marginBottom: 10 }}>
              목표 금액 *
            </label>
            <div className="relative">
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="50000"
                min={100}
                max={100000000}
                className="w-full rounded-[12px] border px-4 py-3 pr-10 text-sm outline-none"
                style={{
                  border: "1.5px solid rgba(14,165,233,0.25)",
                  background: "rgba(14,165,233,0.03)",
                  color: "#0C4B78",
                }}
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: "#64B5D9" }}
              >
                원
              </span>
            </div>
            {targetAmount && !isNaN(parseInt(targetAmount)) && (
              <p className="mt-2" style={{ fontSize: 12, color: "#0EA5E9" }}>
                {parseInt(targetAmount).toLocaleString("ko-KR")}원
              </p>
            )}
          </div>

          {/* 목표 날짜 (선택) */}
          <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(14,165,233,0.10)]">
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0C4B78", display: "block", marginBottom: 4 }}>
              목표일 <span style={{ fontWeight: 400, color: "#64B5D9" }}>(선택)</span>
            </label>
            <p style={{ fontSize: 11, color: "#64B5D9", marginBottom: 10 }}>언제까지 모을 건가요?</p>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-[12px] border px-4 py-3 text-sm outline-none"
              style={{
                border: "1.5px solid rgba(14,165,233,0.25)",
                background: "rgba(14,165,233,0.03)",
                color: "#0C4B78",
              }}
            />
          </div>

          {/* 에러 */}
          {error && (
            <div className="rounded-[14px] px-4 py-3 text-sm font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>
              {error}
            </div>
          )}

          {/* 미리보기 */}
          {title && targetAmount && (
            <div
              className="rounded-[20px] p-5"
              style={{ background: "linear-gradient(135deg,rgba(14,165,233,0.08),rgba(56,189,248,0.08))", border: "1.5px solid rgba(14,165,233,0.2)" }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: "#0EA5E9", marginBottom: 8 }}>미리보기</p>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 32 }}>{emoji}</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#0C4B78" }}>{title}</p>
                  <p style={{ fontSize: 12, color: "#64B5D9" }}>
                    목표: {parseInt(targetAmount || "0").toLocaleString("ko-KR")}원
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 저장 */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-[16px] py-4 text-base font-extrabold text-white transition active:scale-[0.97] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0EA5E9,#38BDF8)" }}
          >
            {isPending ? "저장 중…" : "목표 만들기 🎯"}
          </button>
        </form>
      </main>
    </div>
  );
}
