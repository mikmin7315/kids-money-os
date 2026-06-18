import Link from "next/link";
import {
  ArrowRight,
  CircleDollarSign,
  ClipboardList,
  ReceiptText,
} from "lucide-react";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { ProgressBar, SectionTitle } from "@/components/monari/ui";
import { requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

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
    <MobileAppShell title="가족 금융 홈" subtitle={`${dashboard.parent.name}님, 안녕하세요`}>
      <section className="relative mb-5 overflow-hidden rounded-[30px] bg-[linear-gradient(145deg,#17194b_0%,#28327f_56%,#111d4f_100%)] p-5 text-white shadow-[0_18px_42px_rgba(23,25,75,0.26)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-44 w-44 rounded-full bg-[var(--monari-primary)]/20 blur-3xl" />
        <p className="relative text-[17px] font-800 tracking-[-0.01em]">
          {primary ? `${primary.child.name}의 통장` : "가족 통장 시작하기"}
        </p>
        {primary ? (
          <>
            <p className="relative mt-6 text-center text-[40px] font-800 leading-none tracking-[-0.03em] tabular-nums">
              {formatWon(primary.wallet.balance)}
            </p>
            <p className="relative mt-3 text-center text-[14px] font-600 leading-5 text-white/74">
              {primary.child.name}의 현재 사용 가능 금액
            </p>
          </>
        ) : (
          <p className="relative mt-5 text-center text-[22px] font-800 leading-tight">아이 프로필을 등록해주세요</p>
        )}

        <div className="relative mt-6 grid grid-cols-2 gap-3">
          <Link
            href={totalPending > 0 ? "/approvals" : "/behaviors"}
            className="flex h-14 items-center justify-center rounded-[18px] bg-[var(--monari-primary)] text-[15px] font-700 text-white shadow-[0_10px_24px_rgba(240,100,50,0.28)] transition active:scale-[0.98]"
          >
            {totalPending > 0 ? `요청 ${totalPending}건 확인` : "약속 만들기"}
          </Link>
          <Link
            href="/records"
            className="flex h-14 items-center justify-center rounded-[18px] bg-white/94 text-[15px] font-700 text-[#17194b] shadow-[0_8px_22px_rgba(0,0,0,0.12)] transition active:scale-[0.98]"
          >
            금융 기록 보기
          </Link>
        </div>
      </section>

      {dashboard.children.length > 0 ? (
        <section className="mb-5">
          <SectionTitle action={<Link href="/child-mode">아이 모드 시작</Link>}>아이 통장 바로가기</SectionTitle>
          <div className="mt-3 space-y-3">
            {dashboard.children.map((summary) => (
              <Link key={summary.child.id} href={`/child/${summary.child.id}`} className="monari-card block p-5 transition active:scale-[0.99]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#eeeaff,#fff0e9)] text-[17px] font-800 text-[var(--monari-hero)]">
                      {summary.child.name[0]}
                    </span>
                    <div className="min-w-0">
                    <p className="text-[16px] font-700 leading-5 text-[var(--monari-ink)]">{summary.child.name}</p>
                    <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">
                      저축 {formatWon(summary.wallet.savingsBalance)}
                    </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[18px] font-800 tracking-[-0.01em] text-[var(--monari-ink)]">{formatWon(summary.wallet.balance)}</p>
                    <p className="mt-1 text-[12px] font-700 text-[var(--monari-hero)]">통장 열기 <ArrowRight className="inline h-3 w-3" /></p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="monari-card mb-5 p-5 text-center">
          <p className="text-[15px] font-800 text-[var(--monari-ink)]">첫 아이 통장을 만들어주세요</p>
          <p className="monari-meta mt-1 mb-4">용돈, 약속, 저축을 한곳에서 시작할 수 있어요.</p>
          <Link href="/settings" className="monari-btn-primary w-full">아이 등록하기</Link>
        </div>
      )}

      {primary && (
        <section className="monari-card mb-5 p-5">
          <SectionTitle>이번 달 요약</SectionTitle>
          <div className="mt-4 grid grid-cols-3 divide-x divide-[var(--monari-line-strong)]">
            <SummaryMetric label="받은 용돈" value={formatWon(primary.monthReport.totalAllowance)} />
            <SummaryMetric label="지출 합계" value={formatWon(primary.monthReport.totalSpend)} />
            <SummaryMetric label="저축 금액" value={formatWon(primary.monthReport.totalSave)} />
          </div>
          <div className="mt-5 border-t border-[var(--monari-line)] pt-4">
            <div className="mb-2 flex items-center justify-between text-[12px]">
              <span className="font-700 text-[var(--monari-ink-soft)]">저축 비율</span>
              <strong className="text-[var(--monari-hero)]">{monthlyGoal}%</strong>
            </div>
            <ProgressBar value={monthlyGoal} />
          </div>
        </section>
      )}

      <section className="mb-5">
        <SectionTitle action={<Link href="/records">전체 보기</Link>}>최근 금융 활동</SectionTitle>
        <div className="monari-card mt-3 px-4">
          {recentFeed.length > 0 ? (
            recentFeed.map((item) => (
              <RecentRow
                key={item.id}
                href="/records"
                title={item.title}
                sub={item.sub}
                value={item.amount != null ? `${item.accent === "rose" || item.accent === "amber" ? "-" : "+"}${formatWon(item.amount)}` : item.description}
                kind={item.kind}
              />
            ))
          ) : (
            <p className="py-8 text-center text-[13px] text-[var(--monari-ink-muted)]">아직 금융 활동이 없어요.</p>
          )}
        </div>
      </section>

      {!auth.user && (
        <div className="monari-card mb-4 flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-[14px] font-800 text-[var(--monari-ink)]">지금은 체험 모드예요</p>
            <p className="monari-meta mt-1">로그인하면 가족 기록이 안전하게 저장됩니다.</p>
          </div>
          <Link href="/login" className="monari-btn-primary h-10 shrink-0 px-4 text-[13px]">로그인</Link>
        </div>
      )}
    </MobileAppShell>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 text-center first:pl-0 last:pr-0">
      <p className="text-[11px] font-600 text-[var(--monari-ink-muted)]">{label}</p>
      <p className="mt-1 truncate text-[16px] font-800 tracking-[-0.01em] text-[var(--monari-ink)]">{value}</p>
    </div>
  );
}

function RecentRow({ href, title, sub, value, kind }: { href: string; title: string; sub: string; value: string; kind: string }) {
  const Icon = kind === "money" ? CircleDollarSign : kind === "borrow" ? ReceiptText : ClipboardList;
  return (
    <Link href={href} className="flex min-h-16 items-center gap-3 border-b border-[var(--monari-line)] py-3.5 last:border-b-0 active:bg-[var(--monari-surface-soft)]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f2f4] text-[#183d70]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-700 text-[var(--monari-ink)]">{title}</p>
        <p className="mt-0.5 text-[11px] text-[var(--monari-ink-muted)]">{sub}</p>
      </div>
      <p className="shrink-0 text-[14px] font-800 text-[var(--monari-ink)]">{value}</p>
      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--monari-ink-muted)]" />
    </Link>
  );
}
