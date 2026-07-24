import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, HelpCircle, LogOut, MessageCircle } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

const TERMS: { word: string; emoji: string; desc: string }[] = [
  { word: "이자", emoji: "📈", desc: "남긴 돈에 약속한 비율만큼 더해지는 돈이에요. 돈이 돈을 만들어요!" },
  { word: "이자율", emoji: "💯", desc: "이자가 얼마나 붙는지 알려주는 숫자예요. 높을수록 더 많이 생겨요." },
  { word: "미리쓰기", emoji: "🤝", desc: "지금 없는 돈을 먼저 쓰고, 나중에 더 갚는 약속이에요. 신중하게 써요." },
  { word: "정기 용돈", emoji: "📅", desc: "매주 또는 매달 정해진 날에 받는 용돈이에요." },
  { word: "행동 약속", emoji: "✅", desc: "부모님과 함께 정한 습관이에요. 지키면 이자율이 올라가요!" },
  { word: "저금", emoji: "🐷", desc: "돈을 쓰지 않고 나중을 위해 남겨두는 거예요." },
  { word: "정산", emoji: "📊", desc: "한 달 동안의 이자를 계산해서 잔액에 더해주는 날이에요. 매달 1일이에요." },
  { word: "잔액", emoji: "💰", desc: "지금 내 통장에 있는 전체 돈이에요." },
];

const FAQS: { q: string; a: string }[] = [
  { q: "이자는 언제 생겨요?", a: "매달 1일에 지난 달 남긴 돈에 이자가 더해져요. 기다리면 돈이 스스로 자라요!" },
  { q: "약속을 못 지키면 어떻게 돼요?", a: "이자율이 보너스 없이 기본으로 돌아가요. 벌칙은 없어요. 다음 달에 다시 도전해봐요!" },
  { q: "미리쓴 돈은 언제 갚아요?", a: "부모님과 약속한 날에 용돈에서 자동으로 갚아요. 갚는 날을 꼭 기억해두세요." },
  { q: "돈은 어디서 확인해요?", a: "홈 화면과 '내 돈 기록'에서 들어온 돈, 나간 돈을 모두 볼 수 있어요." },
  { q: "PIN을 잊었어요", a: "부모님께 도움을 요청하세요. 부모님이 새 PIN으로 바꿔줄 수 있어요." },
];

export default async function ChildSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([getChildModeContext(), getAppDataBundle()]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  return (
    <div data-theme="child-violet" style={{ background: "#F5F0FF", minHeight: "100dvh" }}>
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#6C3FE8]">
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      <div className="mb-5">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>{child.name}</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
          ⚙️ 설정 & 도움말
        </h1>
      </div>

      {/* 빠른 메뉴 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link
          href={`/child/${id}/records`}
          className="flex flex-col gap-2 rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-md)] transition active:scale-[0.97]"
        >
          <span style={{ fontSize: 28 }}>📒</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--monari-ink)" }}>내 돈 기록</p>
          <p style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>들어온 돈·나간 돈 확인</p>
        </Link>
        <Link
          href={`/child/${id}/history`}
          className="flex flex-col gap-2 rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-md)] transition active:scale-[0.97]"
        >
          <span style={{ fontSize: 28 }}>✅</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--monari-ink)" }}>약속 기록</p>
          <p style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>지킨 약속 히스토리</p>
        </Link>
        <Link
          href={`/child/${id}/notification-settings`}
          className="flex flex-col gap-2 rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-md)] transition active:scale-[0.97]"
        >
          <span style={{ fontSize: 28 }}>🔔</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: "var(--monari-ink)" }}>알림 설정</p>
          <p style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>받고 싶은 알림 선택</p>
        </Link>
      </div>

      {/* 용어 사전 */}
      <div className="mb-6 rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={18} color="var(--monari-hero)" />
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)" }}>용어 사전</p>
        </div>
        <div className="space-y-3">
          {TERMS.map(({ word, emoji, desc }) => (
            <div key={word} className="rounded-[14px] bg-[var(--monari-hero-lo)] px-4 py-3">
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--monari-hero)" }}>{emoji} {word}</p>
              <p style={{ fontSize: 13, color: "var(--monari-hero)", marginTop: 4, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 자주 묻는 질문 */}
      <div className="mb-6 rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle size={18} color="var(--monari-hero)" />
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--monari-ink)" }}>자주 묻는 질문</p>
        </div>
        <div className="space-y-4">
          {FAQS.map(({ q, a }) => (
            <div key={q}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink)" }}>Q. {q}</p>
              <p style={{ fontSize: 13, color: "var(--monari-ink-muted)", marginTop: 4, lineHeight: 1.7 }}>A. {a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 부모에게 알려주기 / 문의 (C-14) */}
      <div className="mb-6 rounded-[24px] bg-[var(--status-pending-solid)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle size={16} color="var(--monari-primary-strong)" />
          <p style={{ fontSize: 14, fontWeight: 800, color: "var(--status-pending-solid-text)" }}>운영팀에 물어보기</p>
        </div>
        <p style={{ fontSize: 13, color: "var(--monari-pending)", lineHeight: 1.7, marginBottom: 10 }}>
          앱 사용 중 궁금한 점이 있으면 운영팀에 직접 물어볼 수 있어요!
        </p>
        <Link
          href={`/child/${id}/inquiries`}
          className="flex items-center justify-center gap-2 rounded-[12px] bg-[var(--child-spend)] px-4 py-2.5"
        >
          <MessageCircle size={14} color="white" />
          <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>문의하기</span>
        </Link>
      </div>

      {/* 앱 나가기 */}
      <Link
        href="/"
        className="flex items-center gap-3 rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-md)]"
      >
        <LogOut size={18} color="var(--monari-ink-muted)" />
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink-muted)" }}>부모 화면으로 가기</p>
      </Link>
    </main>
    </div>
  );
}
