import type { Metadata } from "next";
import Link from "next/link";
import { getSupportEmail } from "@/lib/public-info";

export const metadata: Metadata = { title: "고객지원 — Monari" };

const FAQS = [
  {
    category: "계정/로그인",
    items: [
      { q: "비밀번호를 잊었어요.", a: "로그인 화면에서 '비밀번호 재설정'을 누르면 이메일로 재설정 링크를 보내드려요." },
      { q: "Google 로그인이 안 돼요.", a: "Google 계정이 연결되지 않은 경우 이메일/비밀번호로 로그인하거나 새 계정을 만들어주세요." },
      { q: "계정을 삭제하고 싶어요.", a: "설정 → 계정 삭제 화면에서 진행할 수 있어요. 삭제하면 모든 가족 데이터가 영구 제거돼요." },
    ],
  },
  {
    category: "아이 모드",
    items: [
      { q: "아이 PIN을 잊었어요.", a: "부모 계정 → 설정 → 아이 프로필 → PIN 관리에서 새 PIN으로 바꿀 수 있어요." },
      { q: "아이 모드에서 나가는 방법은요?", a: "아이 화면 하단 설정 탭 → '부모 화면으로 가기'를 누르면 부모 화면으로 돌아가요." },
      { q: "아이가 직접 용돈을 받을 수 있나요?", a: "아니요. 용돈은 부모님이 지급해요. 아이는 기록 확인과 약속 체크만 할 수 있어요." },
    ],
  },
  {
    category: "이자 & 약속",
    items: [
      { q: "이자는 언제 지급되나요?", a: "매달 1일 00:05(UTC 기준)에 지난 달 남긴 돈에 확정된 이자율로 계산돼요." },
      { q: "이자율은 어떻게 결정되나요?", a: "부모님이 설정한 기본 이자율에 이번 달 행동 약속 달성 보너스가 더해져요." },
      { q: "이자 약속을 중간에 바꿀 수 있나요?", a: "확정 전에는 언제든 바꿀 수 있어요. 확정 후에는 이번 달 변경이 불가해요." },
      { q: "행동 약속을 지키지 못하면 벌칙이 있나요?", a: "아니요. 벌칙 없이 보너스 이자율만 적용되지 않아요. 다음 달에 다시 도전할 수 있어요." },
    ],
  },
  {
    category: "미리쓰기 (빌리기)",
    items: [
      { q: "미리쓰기 요청은 어떻게 하나요?", a: "아이 화면 하단 '미리쓰기' 탭에서 금액과 목적을 입력하면 부모님께 요청이 가요." },
      { q: "부모님이 거절하면 어떻게 되나요?", a: "요청이 거절되고 잔액에 변화가 없어요. 부모님과 직접 이야기해봐요." },
      { q: "갚는 날을 못 지키면 어떻게 되나요?", a: "부모님이 설정한 연체 정책에 따라 처리돼요. 미리 부모님과 상의하는 걸 추천해요." },
    ],
  },
  {
    category: "잔액 & 기록",
    items: [
      { q: "잔액이 예상과 달라요.", a: "내 돈 기록(거래 내역)에서 들어온 돈과 나간 돈을 확인해보세요. 현금 사용 기록이 누락됐을 수 있어요." },
      { q: "현금으로 쓴 돈은 어떻게 기록하나요?", a: "아이 화면 홈 → '현금 기록' 버튼에서 직접 입력할 수 있어요." },
      { q: "지난 달 기록을 볼 수 있나요?", a: "내 돈 기록 화면에서 전체 거래 내역을 날짜 순으로 확인할 수 있어요." },
    ],
  },
];

export default function SupportPage() {
  const supportEmail = getSupportEmail();

  return (
    <div className="mx-auto min-h-screen max-w-[460px] bg-[#faf5ff]" style={{ boxShadow: "0 0 70px rgba(76,29,149,0.16)" }}>
      <div className="px-4 pb-16 pt-12">
        {/* 헤더 */}
        <div className="mb-8">
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--monari-hero)" }}>SUPPORT</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a0533", letterSpacing: "-0.03em", marginTop: 6 }}>
            고객지원
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 8, lineHeight: 1.7 }}>
            궁금한 점은 아래 FAQ에서 확인하거나 이메일로 문의해주세요.
          </p>
        </div>

        {/* 빠른 링크 */}
        <div className="mb-7 grid grid-cols-2 gap-3">
          {[
            { href: "/legal/terms", label: "이용약관", emoji: "📄" },
            { href: "/legal/privacy", label: "개인정보처리방침", emoji: "🔐" },
            { href: "/account-deletion", label: "계정 삭제 안내", emoji: "🗑️" },
            { href: "/login", label: "로그인으로 가기", emoji: "🔑" },
          ].map(({ href, label, emoji }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-[16px] bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition active:scale-[0.97]"
            >
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{label}</span>
            </Link>
          ))}
        </div>

        {/* FAQ 카테고리별 */}
        <div className="space-y-6">
          {FAQS.map(({ category, items }) => (
            <div key={category}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "var(--monari-hero)", marginBottom: 10 }}>
                {category}
              </p>
              <div className="space-y-2">
                {items.map(({ q, a }) => (
                  <details
                    key={q}
                    className="overflow-hidden rounded-[16px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                  >
                    <summary
                      className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4"
                      style={{ fontSize: 14, fontWeight: 700, color: "#1a0533" }}
                    >
                      {q}
                      <span style={{ fontSize: 18, color: "#c4b5fd", flexShrink: 0 }}>+</span>
                    </summary>
                    <div className="border-t border-[#f3f4f6] px-4 py-3.5">
                      <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>{a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 인앱 문의 */}
        <div className="mt-8 rounded-[20px] bg-[var(--monari-hero-lo)] p-5">
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-hero)", marginBottom: 6 }}>
            💬 직접 문의하기
          </p>
          <p style={{ fontSize: 13, color: "var(--monari-hero)", lineHeight: 1.7 }}>
            FAQ에서 해결되지 않은 문제는 앱 내 문의 기능을 이용해주세요.
            운영팀이 직접 확인하고 빠르게 답변드릴게요.
          </p>
          <Link
            href="/inquiries"
            className="mt-4 block w-full rounded-[14px] bg-[var(--monari-hero)] py-3.5 text-center text-sm font-extrabold text-white transition active:scale-[0.97]"
          >
            문의 작성하기
          </Link>
          {supportEmail && (
            <a
              href={`mailto:${supportEmail}`}
              className="mt-2 block w-full rounded-[14px] border border-[var(--monari-hero)] py-3 text-center text-sm font-bold text-[var(--monari-hero)] transition active:scale-[0.97]"
            >
              이메일로 문의하기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
