"use client";

import { useActionState, useState } from "react";
import { cashSpendAction } from "@/actions/finance";
import { MoneyInput } from "@/components/ui/money-input";

const initial = { ok: false, message: "" };

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

const CATEGORIES = [
  { value: "간식·음식", emoji: "🍕" },
  { value: "게임·앱", emoji: "🎮" },
  { value: "학용품", emoji: "✏️" },
  { value: "의류·패션", emoji: "👕" },
  { value: "교통", emoji: "🚌" },
  { value: "엔터테인먼트", emoji: "🎬" },
  { value: "기타", emoji: "📦" },
] as const;

export function CashSpendForm({ childId }: { childId: string }) {
  const [state, action, pending] = useActionState(cashSpendAction, initial);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  if (state.ok) {
    return (
      <div className="py-6 text-center">
        <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
        <p style={{ fontSize: 20, fontWeight: 900, color: "var(--monari-ink)" }}>기록했어요!</p>
        <p className="mt-2" style={{ fontSize: 14, color: "var(--monari-ink-muted)" }}>{state.message}</p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 w-full rounded-[16px] bg-[var(--monari-surface-soft)] py-4 text-base font-extrabold text-[var(--monari-hero)]"
        >
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="childId" value={childId} />
      <input type="hidden" name="category" value={category} />

      {/* 금액 */}
      <div>
        <label htmlFor="amount-input" className="mb-2 block text-sm font-extrabold text-[var(--monari-ink)]">얼마 썼어요?</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(q))}
              className="rounded-[12px] border-2 px-4 py-2 text-sm font-bold transition"
              style={{
                borderColor: amount === String(q) ? "var(--monari-hero)" : "#e5e7eb",
                background: amount === String(q) ? "var(--monari-hero-lo)" : "#fff",
                color: amount === String(q) ? "var(--monari-hero)" : "var(--monari-ink-muted)",
              }}
            >
              {q.toLocaleString()}원
            </button>
          ))}
        </div>
        <MoneyInput
          id="amount-input"
          name="amount"
          min={1}
          value={amount}
          onChange={setAmount}
          placeholder="직접 입력 (원)"
          className="w-full rounded-[16px] border-2 border-[#e5e7eb] px-4 py-3.5 text-base font-bold text-[var(--monari-ink)] outline-none focus:border-[var(--monari-hero)]"
          required
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label className="mb-2 block text-sm font-extrabold text-[var(--monari-ink)]">
          카테고리 <span className="text-[var(--monari-ink-muted)] font-semibold">(선택)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const selected = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(selected ? "" : cat.value)}
                className="flex items-center gap-1.5 rounded-[12px] border-2 px-3 py-2 text-[13px] font-bold transition active:scale-[0.96]"
                style={{
                  borderColor: selected ? "var(--monari-hero)" : "#e5e7eb",
                  background: selected ? "var(--monari-hero-lo)" : "var(--monari-surface)",
                  color: selected ? "var(--monari-hero)" : "var(--monari-ink-muted)",
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.value}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 날짜 */}
      <div>
        <label htmlFor="date-input" className="mb-2 block text-sm font-extrabold text-[var(--monari-ink)]">언제 썼어요?</label>
        <input
          id="date-input"
          name="date"
          type="date"
          defaultValue={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date())}
          className="w-full rounded-[16px] border-2 border-[#e5e7eb] px-4 py-3.5 text-base font-bold text-[var(--monari-ink)] outline-none focus:border-[var(--monari-hero)]"
          required
        />
      </div>

      {/* 메모 */}
      <div>
        <label htmlFor="memo-input" className="mb-2 block text-sm font-extrabold text-[var(--monari-ink)]">뭐에 썼어요? <span className="text-[var(--monari-ink-muted)] font-semibold">(선택)</span></label>
        <input
          id="memo-input"
          name="memo"
          type="text"
          placeholder="예: 편의점 간식, 급식비"
          className="w-full rounded-[16px] border-2 border-[#e5e7eb] px-4 py-3.5 text-base text-[var(--monari-ink)] outline-none focus:border-[var(--monari-hero)]"
          maxLength={50}
        />
      </div>

      {state.message && !state.ok && (
        <p className="rounded-[14px] bg-rose-50 px-4 py-3 text-center text-sm font-bold text-rose-700">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[16px] py-4 text-base font-extrabold text-white transition active:scale-[0.97] disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
      >
        {pending ? "기록 중..." : "기록하기 💸"}
      </button>
    </form>
  );
}
