import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { CashSpendForm } from "@/components/finance/cash-spend-form";

export const dynamic = "force-dynamic";

export default async function ChildCashPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([getChildModeContext(), getAppDataBundle()]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  return (
    <main className="px-4 pb-36 pt-8">
      <Link
        href={`/child/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--monari-hero)]"
      >
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      {/* 헤더 */}
      <div className="mb-5">
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--monari-ink-muted)", marginBottom: 4 }}>현금 사용</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em" }}>
          💸 현금 썼어요
        </h1>
        <p className="mt-2" style={{ fontSize: 14, color: "var(--monari-ink-muted)", lineHeight: 1.6 }}>
          현금으로 쓴 돈을 기록하면 남긴 돈이 정확해져요.
        </p>
      </div>

      {/* 안내 카드 */}
      <div className="mb-5 rounded-[24px] bg-[#fef3c7] p-4">
        <p style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>💡 이렇게 쓸 때 기록해요</p>
        <ul className="mt-2 space-y-1" style={{ fontSize: 13, color: "#b45309" }}>
          <li>• 편의점에서 현금으로 살 때</li>
          <li>• 학교 급식비·현장학습비 낼 때</li>
          <li>• 용돈을 현금으로 받아서 쓸 때</li>
        </ul>
      </div>

      {/* 입력 폼 */}
      <div className="rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <CashSpendForm childId={id} />
      </div>
    </main>
  );
}
