"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { contributeToGoalAction } from "@/actions/goals";

const QUICK_AMOUNTS = [1000, 3000, 5000, 10000, 30000, 50000];

export default function ContributeGoalPage() {
  const { id, goalId } = useParams<{ id: string; goalId: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleQuickAmount(n: number) {
    setAmount(String(n));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const num = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (isNaN(num) || num < 100) { setError("최소 100원 이상 입력해주세요."); return; }

    startTransition(async () => {
      const result = await contributeToGoalAction({
        goalId,
        childId: id,
        amount: num,
        memo: memo.trim() || undefined,
      });
      if (!result.ok) { setError(result.error ?? "기여에 실패했어요."); return; }
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
            목표 응원하기 🎁
          </h1>
          <p style={{ fontSize: 13, color: "#64B5D9", marginTop: 4 }}>
            아이의 목표 달성을 도와주세요!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 빠른 금액 */}
          <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(14,165,233,0.10)]">
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0C4B78", marginBottom: 12 }}>빠른 금액 선택</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleQuickAmount(n)}
                  className="rounded-[12px] py-3 text-sm font-bold transition active:scale-95"
                  style={{
                    background: amount === String(n) ? "rgba(14,165,233,0.15)" : "rgba(14,165,233,0.06)",
                    border: amount === String(n) ? "2px solid #0EA5E9" : "2px solid transparent",
                    color: amount === String(n) ? "#0EA5E9" : "#0C4B78",
                  }}
                >
                  {n.toLocaleString("ko-KR")}원
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 */}
          <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(14,165,233,0.10)]">
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0C4B78", display: "block", marginBottom: 10 }}>
              금액 직접 입력
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                min={100}
                className="w-full rounded-[12px] border px-4 py-3 pr-10 text-sm outline-none"
                style={{
                  border: "1.5px solid rgba(14,165,233,0.25)",
                  background: "rgba(14,165,233,0.03)",
                  color: "#0C4B78",
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#64B5D9" }}>
                원
              </span>
            </div>
            {amount && !isNaN(parseInt(amount)) && (
              <p className="mt-2" style={{ fontSize: 12, color: "#0EA5E9" }}>
                {parseInt(amount).toLocaleString("ko-KR")}원
              </p>
            )}
          </div>

          {/* 응원 메시지 */}
          <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(14,165,233,0.10)]">
            <label style={{ fontSize: 13, fontWeight: 700, color: "#0C4B78", display: "block", marginBottom: 4 }}>
              응원 메시지 <span style={{ fontWeight: 400, color: "#64B5D9" }}>(선택)</span>
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="화이팅! 꼭 달성하자 💪"
              maxLength={50}
              className="w-full rounded-[12px] border px-4 py-3 text-sm outline-none"
              style={{
                border: "1.5px solid rgba(14,165,233,0.25)",
                background: "rgba(14,165,233,0.03)",
                color: "#0C4B78",
              }}
            />
          </div>

          {error && (
            <div className="rounded-[14px] px-4 py-3 text-sm font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !amount}
            className="w-full rounded-[16px] py-4 text-base font-extrabold text-white transition active:scale-[0.97] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0EA5E9,#38BDF8)" }}
          >
            {isPending ? "전송 중…" : `🎁 응원하기${amount ? ` (${parseInt(amount || "0").toLocaleString("ko-KR")}원)` : ""}`}
          </button>
        </form>
      </main>
    </div>
  );
}
