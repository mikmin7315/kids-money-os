"use client";

import { useState } from "react";
import Link from "next/link";

const SLIDES = [
  {
    emoji: "🎯",
    color: "linear-gradient(145deg,#0C4B78 0%,#0369A1 55%,#0EA5E9 100%)",
    tag: "목표 저금통",
    title: "용돈을\n목표로 만들어요",
    body: "용돈을 그냥 주는 대신, 아이가 직접 목표를 세우고 저금해요. 꿈이 생기면 돈을 대하는 태도가 달라져요.",
    ex: { label: "자전거 목표 🚲", value: "72% 달성!" },
  },
  {
    emoji: "📈",
    color: "linear-gradient(145deg,#5b21b6 0%,#7c3aed 55%,#a855f7 100%)",
    tag: "행동 약속",
    title: "약속을 지키면\n이자가 올라가요",
    body: "독서, 청소, 운동… 아이가 약속을 지킬 때마다 이자율이 높아져요. 좋은 습관이 곧 보상이에요.",
    ex: { label: "독서 30분 완료!", value: "+0.5% 📊" },
  },
  {
    emoji: "🔔",
    color: "linear-gradient(145deg,#065f46 0%,#059669 55%,#34d399 100%)",
    tag: "실시간 알림",
    title: "용돈 오면\n아이가 먼저 알아요",
    body: "용돈이 들어오면 아이에게 바로 알림이 가요. 잔액을 확인하고, 저금할지 쓸지 스스로 생각하는 습관이 생겨요.",
    ex: { label: "용돈이 도착했어요! 🎉", value: "잔액 확인하러 가기 →" },
  },
  {
    emoji: "👨‍👩‍👧",
    color: "linear-gradient(145deg,#7c2d12 0%,#c2410c 55%,#f97316 100%)",
    tag: "가족 함께",
    title: "가족이 함께\n꿈을 응원해요",
    body: "목표에 가족이 선물을 더할 수 있어요. 생일, 명절, 특별한 날… 함께 모으는 경험이 진짜 금융교육이에요.",
    ex: { label: "할머니 응원 선물 🎁", value: "+5,000원" },
  },
];

export function OnboardingCarousel() {
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];

  function next() {
    setCurrent((c) => Math.min(c + 1, SLIDES.length - 1));
  }
  function prev() {
    setCurrent((c) => Math.max(c - 1, 0));
  }

  const isLast = current === SLIDES.length - 1;

  return (
    <div className="flex min-h-dvh flex-col" style={{ background: "#faf5ff" }}>
      {/* 슬라이드 카드 */}
      <div
        className="relative flex flex-col items-center overflow-hidden px-6 pb-12 pt-16 text-white"
        style={{ background: slide.color, minHeight: "60vh", transition: "background 0.5s" }}
      >
        {/* 데코 원 */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-6 -left-8 h-32 w-32 rounded-full bg-white/8" />

        {/* 스킵 */}
        <div className="absolute right-5 top-5">
          <Link href="/login" style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>
            건너뛰기
          </Link>
        </div>

        {/* 태그 */}
        <span
          className="relative mb-6 rounded-full px-4 py-1.5 text-xs font-bold"
          style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
        >
          {slide.tag}
        </span>

        {/* 이모지 */}
        <div
          className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full"
          style={{ background: "rgba(255,255,255,0.2)", fontSize: 64 }}
        >
          {slide.emoji}
        </div>

        {/* 제목 */}
        <h1
          className="relative text-center"
          style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.25, letterSpacing: "-0.03em", whiteSpace: "pre-line" }}
        >
          {slide.title}
        </h1>

        {/* 설명 */}
        <p
          className="relative mt-4 text-center"
          style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.8)", maxWidth: 300 }}
        >
          {slide.body}
        </p>

        {/* 예시 뱃지 */}
        <div
          className="relative mt-6 flex items-center gap-2 rounded-[16px] px-4 py-3"
          style={{ background: "rgba(255,255,255,0.18)" }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{slide.ex.label}</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{slide.ex.value}</p>
        </div>

        {/* 인디케이터 */}
        <div className="relative mt-8 flex items-center">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`${i + 1}번째 슬라이드`}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "18px 6px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                className="block rounded-full transition-all"
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  background: i === current ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="flex flex-1 flex-col justify-end px-5 pb-10 pt-6">
        <div className="flex gap-3">
          {current > 0 && (
            <button
              onClick={prev}
              className="flex-1 rounded-[16px] border-2 border-[var(--monari-hero-lo)] py-4 text-base font-extrabold text-[var(--monari-hero)] transition active:scale-[0.97]"
            >
              이전
            </button>
          )}
          {isLast ? (
            <Link
              href="/login"
              className="flex flex-1 items-center justify-center rounded-[16px] py-4 text-base font-extrabold text-white transition active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
            >
              시작하기 🚀
            </Link>
          ) : (
            <button
              onClick={next}
              className="flex-1 rounded-[16px] py-4 text-base font-extrabold text-white transition active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
            >
              다음
            </button>
          )}
        </div>

        {current === 0 && (
          <p className="mt-4 text-center text-xs text-[var(--monari-ink-muted)]">
            이미 계정이 있어요?{" "}
            <Link href="/login" className="font-bold text-[var(--monari-hero)]">
              로그인하기
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
