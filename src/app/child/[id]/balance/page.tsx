import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { estimateInterest } from "@/lib/finance";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ChildBalancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle, dashboard] = await Promise.all([
    getChildModeContext(),
    getAppDataBundle(),
    getDashboardView(),
  ]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  const summary = dashboard.children.find((c) => c.child.id === id);
  if (!child || !summary) notFound();

  const policy = bundle.interestPolicies.find((p) => p.childId === id);
  const estimated = policy ? estimateInterest(summary.wallet, policy) : 0;
  const wallet = summary.wallet;
  const activeBorrow = bundle.borrowRequests.find(
    (r) => r.childId === id && (r.status === "approved" || r.status === "partial"),
  );

  return (
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#7c3aed]">
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      <div className="mb-5">
        <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>{child.name}의 통장</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a0533", letterSpacing: "-0.03em" }}>
          💰 잔액 상세
        </h1>
      </div>

      {/* 총 잔액 카드 */}
      <div
        className="mb-5 overflow-hidden rounded-[24px] p-6 text-white"
        style={{ background: "linear-gradient(145deg,#5b21b6 0%,#7c3aed 55%,#a855f7 100%)" }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>지금 남긴 돈</p>
        <p className="tabular-nums mt-1" style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
          {formatWon(wallet.balance)}
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          이대로면 이번 달 이자 +{formatWon(estimated)}
        </p>
      </div>

      {/* 잔액 분해 */}
      <div className="mb-5 rounded-[20px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p style={{ fontSize: 15, fontWeight: 800, color: "#1a0533", marginBottom: 14 }}>잔액 구성</p>
        <div className="space-y-3">
          <LedgerRow
            emoji="💵"
            label="쓸 수 있는 돈"
            desc="지금 바로 쓸 수 있어요"
            value={formatWon(wallet.balance - wallet.savingsBalance)}
            color="#1a0533"
          />
          <LedgerRow
            emoji="🐷"
            label="저금통"
            desc="따로 모아두는 돈"
            value={formatWon(wallet.savingsBalance)}
            color="#2d67b2"
          />
          {activeBorrow && (
            <LedgerRow
              emoji="🤝"
              label="미리쓰기 잔액"
              desc="아직 갚아야 할 돈"
              value={`-${formatWon(activeBorrow.requestedAmount)}`}
              color="#d97706"
            />
          )}
          <div className="border-t border-[#f3f4f6] pt-3">
            <LedgerRow
              emoji="✨"
              label="예상 이자"
              desc={`이자율 ${wallet.currentInterestRate}% 적용`}
              value={`+${formatWon(estimated)}`}
              color="#059669"
              bold
            />
          </div>
        </div>
      </div>

      {/* 설명 */}
      <div className="mb-5 rounded-[20px] bg-[#f5f3ff] p-4">
        <p style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6", marginBottom: 6 }}>💡 남긴 돈이란?</p>
        <p style={{ fontSize: 13, color: "#7c3aed", lineHeight: 1.7 }}>
          받은 용돈에서 쓴 돈을 빼고 남은 게 "남긴 돈"이에요.
          이 남긴 돈에 이자가 붙어요. 많이 남길수록 이자도 더 많이 생겨요!
        </p>
      </div>

      {/* 빠른 이동 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/child/${id}/records`}
          className="flex flex-col items-center gap-2 rounded-[18px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition active:scale-[0.97]"
        >
          <span style={{ fontSize: 28 }}>📒</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1a0533" }}>거래 내역</p>
        </Link>
        <Link
          href={`/child/${id}/interest`}
          className="flex flex-col items-center gap-2 rounded-[18px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition active:scale-[0.97]"
        >
          <span style={{ fontSize: 28 }}>📈</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1a0533" }}>이자 미리보기</p>
        </Link>
      </div>
    </main>
  );
}

function LedgerRow({
  emoji, label, desc, value, color, bold,
}: { emoji: string; label: string; desc: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ fontSize: 22, width: 32, textAlign: "center" }}>{emoji}</span>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 14, fontWeight: bold ? 800 : 600, color: "#1a0533" }}>{label}</p>
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{desc}</p>
      </div>
      <p className="tabular-nums" style={{ fontSize: 16, fontWeight: 800, color }}>{value}</p>
    </div>
  );
}
