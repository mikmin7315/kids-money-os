import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ChildCreateForm } from "@/components/finance/management-forms";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { requireParentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AddChildPage() {
  const auth = await requireParentSession();
  if (!auth.user) redirect("/login");

  return (
    <AppNavShell>
      <PageHero>
        <Link href="/settings" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70">
          <ArrowLeft size={14} /> 설정으로
        </Link>
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60 mb-1">아이 프로필</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">아이 추가하기</h1>
        <p className="text-[13px] text-white/65">아이 이름과 정보를 등록하면 용돈·이자·미리쓰기를 관리할 수 있어요</p>
      </PageHero>

      <PageContent className="pt-5">
        {/* 등록 후 할 수 있는 것 */}
        <div className="mb-5 rounded-[16px] bg-[var(--monari-hero-lo)] px-4 py-4">
          <p className="text-[12px] font-bold text-[var(--monari-hero)] mb-2">등록 후 할 수 있는 것</p>
          <div className="space-y-2">
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
                <p className="text-[13px] font-semibold text-[var(--monari-hero)]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 등록 폼 */}
        <div className="monari-card p-5 mb-6">
          <p className="mb-4 text-[14px] font-extrabold text-[var(--monari-ink)]">아이 정보 입력</p>
          <ChildCreateForm />
        </div>
      </PageContent>
    </AppNavShell>
  );
}
