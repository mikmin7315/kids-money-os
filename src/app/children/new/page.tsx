import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ChildCreateForm } from "@/components/finance/management-forms";
import { requireParentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AddChildPage() {
  const auth = await requireParentSession();
  if (!auth.user) redirect("/login");

  return (
    <div
      className="mx-auto min-h-screen max-w-[460px] bg-[#faf5ff]"
      style={{ boxShadow: "0 0 70px rgba(76,29,149,0.16)" }}
    >
      <div className="px-4 pb-16 pt-12">
        <Link
          href="/settings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]"
        >
          <ArrowLeft size={16} /> 설정으로
        </Link>

        {/* 히어로 */}
        <div
          className="relative mb-8 overflow-hidden rounded-[28px] p-6 text-white"
          style={{
            background: "linear-gradient(145deg,#5b21b6 0%,#7c3aed 55%,#a855f7 100%)",
            boxShadow: "0 16px 40px rgba(109,40,217,0.35)",
          }}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative">
            <p style={{ fontSize: 40 }}>👶</p>
            <h1 className="mt-3 text-2xl font-black tracking-tight">아이 프로필 등록</h1>
            <p className="mt-2 text-sm text-white/75">
              아이 이름과 정보를 등록하면 용돈, 이자, 미리쓰기 규칙을 설정할 수 있어요.
            </p>
          </div>
        </div>

        {/* 단계 안내 */}
        <div className="mb-6 rounded-[24px] bg-white p-4 shadow-[var(--monari-shadow-md)]">
          <p className="mb-3 text-xs font-bold text-[var(--monari-ink-muted)]">등록 후 할 수 있는 것</p>
          <div className="space-y-2.5">
            {[
              { step: "1", text: "아이 모드 PIN 설정 — 아이 전용 화면 접근", color: "var(--monari-hero)" },
              { step: "2", text: "정기 용돈 규칙 설정 — 매주·매월 자동 지급", color: "var(--monari-done)" },
              { step: "3", text: "이자율 설정 — 약속 달성에 따라 이자 변화", color: "var(--monari-primary-strong)" },
            ].map(({ step, text, color }) => (
              <div key={step} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white"
                  style={{ background: color }}
                >
                  {step}
                </span>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-soft)" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 등록 폼 */}
        <div className="rounded-[24px] bg-white p-5 shadow-[var(--monari-shadow-md)]">
          <p className="mb-4 text-sm font-extrabold text-[var(--monari-ink)]">아이 정보 입력</p>
          <ChildCreateForm />
        </div>
      </div>
    </div>
  );
}
