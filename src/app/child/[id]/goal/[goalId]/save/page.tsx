"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, PiggyBank } from "lucide-react";
import { childSaveToGoalAction } from "@/actions/goals";

const QUICK_AMOUNTS = [500, 1000, 2000, 3000, 5000, 10000];

export default function ChildSaveToGoalPage() {
  const { id, goalId } = useParams<{ id: string; goalId: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleQuickAmount(n: number) {
    setAmount(String(n));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const num = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (isNaN(num) || num < 100) {
      setError("저금할 금액을 입력해주세요. (최소 100원)");
      return;
    }

    startTransition(async () => {
      const result = await childSaveToGoalAction({ goalId, childId: id, amount: num });
      if (!result.ok) {
        setError(result.error ?? "저금에 실패했어요.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push(`/child/${id}/goal`), 1200);
    });
  }

  if (done) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6"
        style={{ background: "linear-gradient(180deg,#E0F2FE 0%,#BAE6FD 100%)" }}
      >
        <span style={{ fontSize: 72 }}>🎉</span>
        <p style={{ fontSize: 20, fontWeight: 900, color: "#0C4B78", textAlign: "center" }}>
          저금 완료!<br />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#0EA5E9" }}>목표에 가까워졌어요</span>
        </p>
      </div>
    );
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

        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[16px]"
            style={{ background: "linear-gradient(135deg,#0EA5E9,#38BDF8)" }}
          >
            <PiggyBank className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0C4B78", letterSpacing: "-0.03em" }}>
              저금하기 🐷
            </h1>
            <p style={{ fontSize: 12, color: "#64B5D9", marginTop: 2 }}>내 잔액에서 목표로 옮겨요</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 빠른 금액 */}
          <div className="rounded-[20px] bg-white p-5 shadow-[0_4px_16px_rgba(14,165,233,0.10)]">
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0C4B78", marginBottom: 12 }}>빠른 금액</p>
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
              직접 입력
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null); }}
                placeholder="0"
                min={100}
                className="w-full rounded-[12px] border px-4 py-3 pr-10 text-right text-lg font-bold outline-none"
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
            {amount && !isNaN(parseInt(amount)) && parseInt(amount) > 0 && (
              <p className="mt-2 text-right" style={{ fontSize: 12, color: "#0EA5E9", fontWeight: 700 }}>
                {parseInt(amount).toLocaleString("ko-KR")}원 저금
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-[14px] px-4 py-3 text-sm font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !amount || parseInt(amount) < 100}
            className="w-full rounded-[16px] py-4 text-base font-extrabold text-white transition active:scale-[0.97] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", marginTop: 8 }}
          >
            {isPending
              ? "저금 중…"
              : amount && parseInt(amount) >= 100
              ? `🐷 ${parseInt(amount).toLocaleString("ko-KR")}원 저금하기`
              : "🐷 저금하기"}
          </button>
        </form>
      </main>
    </div>
  );
}
