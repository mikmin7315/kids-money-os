import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  ClipboardList,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon, formatWonParts } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const today = new Date().toISOString().slice(0, 10);
  const auth = await requireAppConsent();
  const [dashboard, bundle] = await Promise.all([getDashboardView(), getAppDataBundle()]);
  const pendingBehaviors = bundle.behaviorLogs.filter((log) => log.status === "pending");
  const pendingBorrows = bundle.borrowRequests.filter((request) => request.status === "pending");
  const totalPending = pendingBehaviors.length + pendingBorrows.length;
  const primary = dashboard.children[0];
  const recentFeed = dashboard.activityFeed.slice(0, 3).map((item) => {
    const childName = dashboard.children.find((child) => child.child.id === item.childId)?.child.name;
    return {
      ...item,
      sub: `${childName ?? "가족"} · ${item.date === today ? "오늘" : item.date.slice(5).replace("-", ".")}`,
    };
  });

  const monthlyGoal = primary
    ? Math.min(100, Math.round((primary.monthReport.totalSave / Math.max(primary.monthReport.totalAllowance, 1)) * 100))
    : 0;

  return (
    <MobileAppShell title={`안녕하세요, ${dashboard.parent.name.split(" ")[0]}님 👋`} subtitle="Monari">

      {/* ── 히어로 카드 ── */}
      <section
        className="relative mb-4 overflow-hidden rounded-[28px] p-6 text-white"
        style={{ background: "linear-gradient(145deg, #5b21b6 0%, #7c3aed 55%, #9333ea 100%)", boxShadow: "0 20px 50px rgba(109,40,217,0.40)" }}
      >
        {/* 밝은 하이라이트 원 */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-10 top-5 h-16 w-16 rounded-full bg-white/8" />

        {/* 상단: 라벨 + 이자율 */}
        <div className="relative flex items-center justify-between mb-5">
          <p className="text-[13px] tracking-[0.04em] text-white/60" style={{ fontWeight: 500 }}>
            {primary ? `${primary.child.name}의 통장` : "가족 통장"}
          </p>
          {primary && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[12px] text-white" style={{ fontWeight: 700 }}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#86efac]" />
              이자 {primary.wallet.currentInterestRate}%
            </span>
          )}
        </div>

        {primary ? (
          <>
            {/* 잔액 */}
            <div className="relative leading-none mb-1">
              <span
                className="tabular-nums"
                style={{ fontSize: 60, fontWeight: 900, letterSpacing: "-0.04em" }}
              >
                {formatWonParts(primary.wallet.balance).amount}
              </span>
              <span className="ml-1.5 text-white/50" style={{ fontSize: 24, fontWeight: 600 }}>원</span>
            </div>
            <p className="relative text-[13px] text-white/45 mb-6" style={{ fontWeight: 400 }}>현재 잔액</p>

            {/* 대기 알림 */}
            {totalPending > 0 && (
              <div className="relative mb-4 flex items-center gap-2.5 rounded-[14px] bg-black/15 px-4 py-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fbbf24] text-[11px] text-[#78350f]" style={{ fontWeight: 800 }}>{totalPending}</span>
                <span className="text-[13px] text-white/85" style={{ fontWeight: 600 }}>승인 대기 중인 요청이 있어요</span>
                <ArrowRight className="ml-auto h-4 w-4 text-white/40" />
              </div>
            )}

            {/* 버튼 */}
            <div className="relative grid grid-cols-2 gap-2.5">
              <Link
                href={totalPending > 0 ? "/approvals" : "/behaviors"}
                className="flex h-13 items-center justify-center rounded-[16px] bg-white transition active:scale-[0.97]"
                style={{ color: "#6d28d9", fontSize: 15, fontWeight: 800 }}
              >
                {totalPending > 0 ? `${totalPending}건 확인` : "약속 만들기"}
              </Link>
              <Link
                href="/records"
                className="flex h-13 items-center justify-center rounded-[16px] bg-white/15 text-white transition active:scale-[0.97]"
                style={{ fontSize: 15, fontWeight: 700 }}
              >
                기록 보기
              </Link>
            </div>
          </>
        ) : (
          <p className="relative mt-5 leading-snug text-white" style={{ fontSize: 24, fontWeight: 800 }}>아이 프로필을<br />등록해주세요</p>
        )}
      </section>

      {/* ── 아이 통장 바로가기 ── */}
      {dashboard.children.length > 0 ? (
        <section className="mb-4">
          <SectionLabel action={<Link href="/child-mode" className="text-[13px] font-700 text-[#7c3aed]">아이 모드 시작</Link>}>
            아이 통장
          </SectionLabel>
          <div className="mt-2.5 space-y-2.5">
            {dashboard.children.map((summary) => (
              <div
                key={summary.child.id}
                className="rounded-[20px] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
              >
                <Link
                  href={`/child/${summary.child.id}`}
                  className="flex items-center gap-4 p-4 transition active:scale-[0.99]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#7c3aed] text-[20px] font-800 text-white shadow-[0_4px_12px_rgba(124,58,237,0.30)]">
                    {summary.child.name[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-700 text-[#1a0533]">{summary.child.name}</p>
                    <p className="mt-0.5 text-[13px] font-500 text-[#7c3aed]/60">
                      저축 {formatWon(summary.wallet.savingsBalance)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[20px] font-800 tracking-[-0.02em] text-[#1a0533]">
                      {formatWon(summary.wallet.balance)}
                    </p>
                    <p className="mt-0.5 text-[12px] font-600 text-[#7c3aed] flex items-center justify-end gap-0.5">
                      열기 <ArrowRight className="h-3 w-3" />
                    </p>
                  </div>
                </Link>
                <div className="border-t border-[#f3f4f6] px-4 py-2.5">
                  <Link
                    href={`/child/${summary.child.id}/give-allowance`}
                    className="flex items-center justify-center gap-1.5 rounded-[12px] bg-[#f0fdf4] py-2 text-sm font-extrabold text-[#059669] transition active:scale-[0.97]"
                  >
                    <CircleDollarSign className="h-4 w-4" /> 용돈 바로 주기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="mb-4 rounded-[20px] bg-white p-5 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[16px] font-800 text-[#1a0533]">첫 아이 통장을 만들어주세요</p>
          <p className="mt-1 mb-4 text-[14px] text-[#6b7280]">용돈, 약속, 저축을 한곳에서 시작할 수 있어요.</p>
          <Link href="/settings" className="monari-btn-primary w-full">아이 등록하기</Link>
        </div>
      )}

      {/* ── 이번 달 요약 (벤토 그리드) ── */}
      {primary && (
        <section className="mb-4">
          <SectionLabel>이번 달 요약</SectionLabel>
          <div className="mt-2.5 grid grid-cols-2 gap-2.5">

            {/* 받은 용돈 — 전폭 */}
            <div className="col-span-2 rounded-[20px] bg-[#7c3aed] p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-600 text-white/60 mb-1.5">이번 달 용돈</p>
                  <p className="text-[36px] font-900 tracking-[-0.03em] leading-none tabular-nums">
                    {formatWon(primary.monthReport.totalAllowance)}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white/15">
                  <Wallet className="h-5 w-5 text-white" />
                </span>
              </div>
            </div>

            {/* 지출 합계 */}
            <div className="rounded-[20px] p-4" style={{ background: "#fecdd3" }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-[#9f1239]" style={{ fontWeight: 700 }}>지출</p>
                <TrendingDown className="h-4 w-4 text-[#e11d48]" />
              </div>
              <p className="leading-none tabular-nums text-[#9f1239]" style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em" }}>
                {formatWon(primary.monthReport.totalSpend)}
              </p>
            </div>

            {/* 저축 금액 */}
            <div className="rounded-[20px] p-4" style={{ background: "#a7f3d0" }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] text-[#065f46]" style={{ fontWeight: 700 }}>저축</p>
                <TrendingUp className="h-4 w-4 text-[#059669]" />
              </div>
              <p className="leading-none tabular-nums text-[#065f46]" style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em" }}>
                {formatWon(primary.monthReport.totalSave)}
              </p>
            </div>

            {/* 저축 비율 */}
            <div className="col-span-2 rounded-[20px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[14px] font-700 text-[#374151]">저축 비율</p>
                <strong className="text-[20px] font-900 text-[#7c3aed]">{monthlyGoal}%</strong>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ede9fe]">
                <div
                  className="h-full rounded-full bg-[#7c3aed] transition-all"
                  style={{ width: `${monthlyGoal}%` }}
                />
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ── 최근 금융 활동 ── */}
      <section className="mb-5">
        <SectionLabel action={<Link href="/records" className="text-[13px] font-700 text-[#7c3aed]">전체 보기</Link>}>
          최근 활동
        </SectionLabel>
        <div className="mt-2.5 rounded-[20px] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
          {recentFeed.length > 0 ? (
            recentFeed.map((item, i) => (
              <RecentRow
                key={item.id}
                href="/records"
                title={item.title}
                sub={item.sub}
                value={item.amount != null ? `${item.accent === "rose" || item.accent === "amber" ? "-" : "+"}${formatWon(item.amount)}` : item.description}
                kind={item.kind}
                isLast={i === recentFeed.length - 1}
              />
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-[36px]">🌱</p>
              <p className="mt-2.5 text-[16px] font-700 text-[#1a0533]">아직 활동이 없어요</p>
              <p className="mt-1 text-[14px] text-[#9ca3af]">용돈을 주거나 약속을 만들어보세요</p>
            </div>
          )}
        </div>
      </section>

      {!auth.user && (
        <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-800 text-[#1a0533]">지금은 체험 모드예요</p>
            <p className="mt-0.5 text-[13px] text-[#9ca3af]">로그인하면 가족 기록이 안전하게 저장됩니다.</p>
          </div>
          <Link href="/login" className="monari-btn-primary h-10 shrink-0 px-4 text-[13px]">로그인</Link>
        </div>
      )}
    </MobileAppShell>
  );
}

function SectionLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-[18px] font-800 text-[#1a0533]">{children}</h2>
      {action}
    </div>
  );
}

function RecentRow({ href, title, sub, value, kind, isLast }: {
  href: string; title: string; sub: string; value: string; kind: string; isLast: boolean;
}) {
  const Icon = kind === "money" ? CircleDollarSign : kind === "borrow" ? ReceiptText : ClipboardList;
  const isNeg = value.startsWith("-");
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3.5 transition active:bg-[#faf5ff] ${!isLast ? "border-b border-[#f3f4f6]" : ""}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f5f3ff] text-[#7c3aed]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-700 text-[#1a0533]">{title}</p>
        <p className="mt-0.5 text-[12px] text-[#9ca3af]">{sub}</p>
      </div>
      <p className={`shrink-0 text-[15px] font-800 ${isNeg ? "text-[#be123c]" : "text-[#15803d]"}`}>{value}</p>
    </Link>
  );
}
