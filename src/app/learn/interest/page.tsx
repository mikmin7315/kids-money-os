"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";

const steps = [
  {
    emoji: "🤔",
    title: "이자가 뭐야?",
    body: "저금통에 돈을 넣어두면 시간이 지날수록 돈이 조금씩 늘어나!\n이렇게 저절로 생기는 돈을 이자라고 해 😊",
    example: null,
    bg: "from-yellow-50 to-amber-50",
    accent: "bg-amber-400",
  },
  {
    emoji: "🌱",
    title: "돈이 자란다고?",
    body: "1,000원을 저금하면 이자율이 10%일 때 100원이 더 생겨!\n약속을 잘 지킬수록 이자율이 올라가서 돈이 더 빨리 자라.",
    example: {
      label: "예시",
      items: [
        { icon: "💰", text: "저축 1,000원" },
        { icon: "✨", text: "이자율 10%" },
        { icon: "🎉", text: "이자 +100원!" },
      ],
    },
    bg: "from-green-50 to-emerald-50",
    accent: "bg-emerald-400",
  },
  {
    emoji: "⭐",
    title: "이자율을 높이려면?",
    body: "약속을 잘 지키면 이자율이 올라가!\n숙제 완료, 일찍 일어나기 같은 약속을 매일 지키면 내 이자율이 쑥쑥 올라가.",
    example: {
      label: "이렇게 해봐!",
      items: [
        { icon: "📚", text: "숙제 완료 → 이자율 +1%" },
        { icon: "🌅", text: "일찍 일어나기 → 이자율 +1%" },
        { icon: "🧹", text: "방 청소하기 → 이자율 +1%" },
      ],
    },
    bg: "from-sky-50 to-blue-50",
    accent: "bg-sky-400",
  },
  {
    emoji: "💸",
    title: "미리쓰기가 뭐야?",
    body: "아직 용돈을 못 받았는데 지금 당장 필요한 게 있을 때, 미리 빌려서 쓸 수 있어!\n단, 나중에 꼭 갚아야 해. 그리고 빌리면 이자를 내야 해.",
    example: {
      label: "기억해!",
      items: [
        { icon: "✅", text: "필요할 때 미리 빌릴 수 있어" },
        { icon: "⚠️", text: "빌린 돈엔 이자가 붙어" },
        { icon: "📅", text: "다음 용돈으로 꼭 갚아야 해" },
      ],
    },
    bg: "from-rose-50 to-pink-50",
    accent: "bg-rose-400",
  },
  {
    emoji: "🏆",
    title: "이제 알겠지?",
    body: "약속을 잘 지키면 이자율이 올라가고,\n이자율이 높을수록 내 저축이 더 빨리 자라!\n열심히 약속을 지켜서 내 돈을 쑥쑥 키워봐 💪",
    example: null,
    bg: "from-purple-50 to-violet-50",
    accent: "bg-violet-400",
  },
];

export default function LearnInterestPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-[var(--color-bg)] px-4 pb-10 pt-8">
      {/* Progress dots */}
      <div className="flex gap-2">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? `w-6 ${current.accent}` : "w-2 bg-[var(--color-border)]"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className={`mt-6 w-full max-w-sm rounded-[32px] bg-gradient-to-br ${current.bg} p-7 shadow-lg`}>
        <div className="text-center text-6xl">{current.emoji}</div>
        <h1 className="mt-5 text-center text-2xl font-bold tracking-tight text-[var(--color-text)]">
          {current.title}
        </h1>
        <p className="mt-4 whitespace-pre-line text-center text-base leading-7 text-[var(--color-muted)]">
          {current.body}
        </p>

        {current.example && (
          <div className="mt-6 rounded-2xl bg-white/70 p-4">
            <p className="mb-3 text-xs font-semibold text-[var(--color-soft)]">{current.example.label}</p>
            <div className="space-y-3">
              {current.example.items.map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex w-full max-w-sm gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text)]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {isLast ? (
          <button
            onClick={() => router.back()}
            className="flex h-14 flex-1 items-center justify-center rounded-full bg-[var(--color-text)] text-base font-bold text-[var(--color-bg)]"
          >
            다 배웠어! 🎉
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-text)] text-base font-bold text-[var(--color-bg)]"
          >
            다음
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </main>
  );
}
