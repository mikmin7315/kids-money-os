import Link from "next/link";
import { requireParentSession } from "@/lib/auth";

export default async function OnboardingCompletePage() {
  await requireParentSession();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 pb-12 pt-16 text-center">
      <div
        className="mb-8 flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)" }}
      >
        <span style={{ fontSize: 44 }}>🎉</span>
      </div>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: "var(--monari-ink)",
          letterSpacing: "-0.03em",
          lineHeight: 1.25,
          marginBottom: 12,
        }}
      >
        Monari에 오신 걸<br />환영해요!
      </h1>

      <p style={{ fontSize: 15, color: "var(--monari-ink-muted)", lineHeight: 1.75, maxWidth: 280 }}>
        이제 아이의 첫 금융 교육을 시작할 준비가 됐어요. 용돈을 주고, 약속을 만들고, 이자와 저축을 함께 배워봐요.
      </p>

      <div className="mt-10 w-full max-w-xs space-y-3">
        <Link
          href="/settings"
          className="block w-full rounded-[16px] bg-[var(--monari-hero)] py-4 text-[16px] font-extrabold text-white transition active:scale-[0.97]"
        >
          아이 등록하기
        </Link>
        <Link
          href="/"
          className="block w-full rounded-[16px] border border-[#e5e7eb] bg-white py-4 text-[16px] font-bold text-[var(--monari-ink-soft)] transition active:scale-[0.97]"
        >
          홈으로 가기
        </Link>
      </div>

      <div className="mt-12 space-y-4 text-left w-full max-w-xs">
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", marginBottom: 8 }}>다음 단계 추천</p>
        {[
          { emoji: "👶", title: "아이 프로필 만들기", desc: "이름·닉네임·PIN을 설정해요", href: "/children/new" },
          { emoji: "💰", title: "이자율 설정", desc: "기본 이자율과 행동 약속 보너스를 정해요", href: "/settings/interest" },
          { emoji: "📅", title: "정기 용돈 설정", desc: "매주·매월 자동 지급 규칙을 만들어요", href: "/settings/allowance" },
        ].map(({ emoji, title, desc, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-[14px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition active:scale-[0.98]"
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>{emoji}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--monari-ink)" }}>{title}</p>
              <p style={{ fontSize: 12, color: "var(--monari-ink-muted)" }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
