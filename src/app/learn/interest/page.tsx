"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";

const steps = [
  {
    emoji: "🤔",
    title: "이자가 뭐야?",
    body: "저금통에 돈을 넣어두면\n시간이 지날수록 돈이 조금씩 늘어나!\n이렇게 저절로 생기는 돈을 이자라고 해 😊",
    example: null,
    accent: "#4f46e5",
    bg: "#f4f3ff",
  },
  {
    emoji: "🌱",
    title: "돈이 자란다고?",
    body: "1,000원을 저금하면\n이자율이 10%일 때 100원이 더 생겨!\n약속을 잘 지킬수록 이자율이 올라가.",
    example: {
      items: [
        { icon: "💰", text: "저축 1,000원" },
        { icon: "✨", text: "이자율 10%" },
        { icon: "🎉", text: "이자 +100원 생김!" },
      ],
    },
    accent: "#059669",
    bg: "#ecfdf5",
  },
  {
    emoji: "⭐",
    title: "이자율 높이는 법",
    body: "약속을 잘 지키면 이자율이 올라가!\n매일매일 약속을 지켜봐.",
    example: {
      items: [
        { icon: "📚", text: "숙제 완료 → 이자율 +1%" },
        { icon: "🌅", text: "일찍 일어나기 → 이자율 +1%" },
        { icon: "🧹", text: "방 청소하기 → 이자율 +1%" },
      ],
    },
    accent: "#d97706",
    bg: "#fffbeb",
  },
  {
    emoji: "💳",
    title: "미리쓰기가 뭐야?",
    body: "용돈을 아직 못 받았는데\n지금 당장 필요한 게 있을 때 빌릴 수 있어!\n단, 나중에 꼭 갚아야 해.",
    example: {
      items: [
        { icon: "✅", text: "필요할 때 미리 빌릴 수 있어" },
        { icon: "⚠️", text: "빌리면 이자가 붙어" },
        { icon: "📅", text: "다음 용돈으로 꼭 갚아야 해" },
      ],
    },
    accent: "#dc2626",
    bg: "#fff1f2",
  },
  {
    emoji: "🏆",
    title: "이제 알겠지?",
    body: "약속을 잘 지키면 이자율이 올라가고\n저축이 더 빨리 자라!\n열심히 해서 내 돈을 쑥쑥 키워봐 💪",
    example: null,
    accent: "#4f46e5",
    bg: "#f4f3ff",
  },
];

export default function LearnInterestPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-bg)] px-5 pb-10 pt-10" data-theme="child">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">

        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            ← 뒤로
          </button>
          <span className="text-sm font-semibold text-[var(--color-soft)]">
            {step + 1} / {steps.length}
          </span>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-card)]">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((step + 1) / steps.length) * 100}%`,
              backgroundColor: current.accent,
            }}
          />
        </div>

        <div
          className="mt-8 flex-1 rounded-[30px] border border-[var(--color-chip-border)] p-7 shadow-[var(--shadow-card)]"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.65), ${current.bg})`,
          }}
        >
          <div className="text-center text-7xl">{current.emoji}</div>
          <h1 className="mt-6 text-center font-display text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            {current.title}
          </h1>
          <p className="mt-4 whitespace-pre-line text-center text-base leading-7 text-[var(--color-muted)]">
            {current.body}
          </p>

          {current.example && (
            <div className="mt-6 space-y-3 rounded-[24px] bg-white/75 p-4">
              {current.example.items.map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-white/70 text-[var(--color-text)] hover:border-[var(--color-accent)]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {isLast ? (
            <button
              onClick={() => router.back()}
              className="flex h-14 flex-1 items-center justify-center rounded-full text-base font-black text-white transition hover:opacity-90"
              style={{ backgroundColor: current.accent }}
            >
              다 배웠어! 🎉
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full text-base font-black text-white transition hover:opacity-90"
              style={{ backgroundColor: current.accent }}
            >
              다음
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
