import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  ReceiptText,
  Store,
  Target,
  TrendingUp,
} from "lucide-react";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { ProgressBar, SectionTitle } from "@/components/monari/ui";
import { requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

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
      <section className="mb-5 overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#0d326c_0%,#123f82_55%,#0b2d63_100%)] p-5 text-white shadow-[0_14px_32px_rgba(13,50,108,0.24)]">
        <p className="text-[17px] font-800 tracking-tight">이번 달 가족 통장</p>
        {primary ? (
          <>
            <p className="mt-5 text-center text-[38px] font-900 leading-none tracking-[-0.05em] tabular-nums">
              {formatWon(primary.wallet.balance)}
            </p>
            <p className="mt-3 text-center text-[14px] font-600 text-white/75">
              {primary.child.name}의 현재 사용 가능 금액
            </p>
          </>
        ) : (
          <p className="mt-5 text-center text-[22px] font-800">아이 프로필을 등록해주세요</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href={totalPending > 0 ? "/approvals" : "/behaviors"}
            prefetch={false}
            className="flex h-14 items-center justify-center rounded-[15px] bg-[var(--monari-primary)] text-[15px] font-800 text-white transition active:scale-[0.98]"
          >
            {totalPending > 0 ? `요청 ${totalPending}건 확인` : "약속 만들기"}
          </Link>
          <Link
            href="/records"
            prefetch={false}
            className="flex h-14 items-center justify-center rounded-[15px] bg-white text-[15px] font-800 text-[#0d326c] transition active:scale-[0.98]"
          >
            금융 기록 보기
          </Link>
        </div>
      </section>

      {primary && (
        <section className="monari-card mb-5 p-5">
          <SectionTitle>이번 달 요약</SectionTitle>
          <div className="mt-4 grid grid-cols-3 divide-x divide-[var(--monari-line-strong)]">
            <SummaryMetric label="받은 용돈" value={formatWon(primary.monthReport.totalAllowance)} />
            <SummaryMetric label="지출 합계" value={formatWon(primary.monthReport.totalSpend)} />
            <SummaryMetric label="저축 금액" value={formatWon(primary.monthReport.totalSave)} />
          </div>
        </section>
      )}

      <section className="monari-card mb-5 overflow-hidden">
        <div className="grid grid-cols-2">
          <InsightCell
            icon={<TrendingUp className="h-5 w-5" />}
            label="이번 주 활동"
            value={`${bundle.behaviorLogs.filter((log) => log.date >= weekStart(today)).length}건`}
          />
          <InsightCell
            icon={<Store className="h-5 w-5" />}
            label="확인할 요청"
            value={`${totalPending}건`}
            rightBorder={false}
          />
          <InsightCell
            icon={<Target className="h-5 w-5" />}
            label="저축 목표 달성률"
            value={`${monthlyGoal}%`}
            bottomBorder={false}
          >
            <ProgressBar value={monthlyGoal} />
          </InsightCell>
          <InsightCell
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="남은 약속"
            value={`${pendingBehaviors.length}개`}
            rightBorder={false}
            bottomBorder={false}
          />
        </div>
      </section>

      <section className="mb-5">
        <SectionTitle action={<Link href="/records" prefetch={false}>전체 보기</Link>}>최근 금융 활동</SectionTitle>
        <div className="monari-card mt-3 px-4">
          {recentFeed.length > 0 ? (
            recentFeed.map((item) => (
              <RecentRow
                key={item.id}
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

      {dashboard.children.length > 0 ? (
        <section className="mb-5">
          <SectionTitle action={<Link href="/child-mode" prefetch={false}>아이 모드</Link>}>아이별 통장</SectionTitle>
          <div className="mt-3 space-y-3">
            {dashboard.children.map((summary) => (
              <Link key={summary.child.id} href={`/child/${summary.child.id}`} prefetch={false} className="monari-card block p-5 transition active:scale-[0.99]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[16px] font-800 text-[var(--monari-ink)]">{summary.child.name}</p>
                    <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">
                      저축 {formatWon(summary.wallet.savingsBalance)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-800 text-[var(--monari-ink)]">{formatWon(summary.wallet.balance)}</p>
                    <p className="mt-1 text-[12px] font-700 text-[var(--monari-hero)]">통장 보기 <ArrowRight className="inline h-3 w-3" /></p>
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
          <Link href="/settings" prefetch={false} className="monari-btn-primary w-full">아이 등록하기</Link>
        </div>
      )}

      {!auth.user && (
        <div className="monari-card mb-4 flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-[14px] font-800 text-[var(--monari-ink)]">지금은 체험 모드예요</p>
            <p className="monari-meta mt-1">로그인하면 가족 기록이 안전하게 저장됩니다.</p>
          </div>
          <Link href="/login" prefetch={false} className="monari-btn-primary h-10 shrink-0 px-4 text-[13px]">로그인</Link>
        </div>
      )}
    </MobileAppShell>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 text-center first:pl-0 last:pr-0">
      <p className="text-[11px] font-600 text-[var(--monari-ink-muted)]">{label}</p>
      <p className="mt-1 truncate text-[16px] font-900 tracking-tight text-[var(--monari-ink)]">{value}</p>
    </div>
  );
}

function InsightCell({
  icon,
  label,
  value,
  children,
  rightBorder = true,
  bottomBorder = true,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children?: React.ReactNode;
  rightBorder?: boolean;
  bottomBorder?: boolean;
}) {
  return (
    <div className={`min-h-[112px] p-4 ${rightBorder ? "border-r border-[var(--monari-line)]" : ""} ${bottomBorder ? "border-b border-[var(--monari-line)]" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f2f4] text-[#183d70]">{icon}</span>
        <p className="text-[11px] font-600 text-[var(--monari-ink-muted)]">{label}</p>
      </div>
      <p className="mt-2 text-[18px] font-900 tracking-tight text-[var(--monari-ink)]">{value}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function RecentRow({ title, sub, value, kind }: { title: string; sub: string; value: string; kind: string }) {
  const Icon = kind === "money" ? CircleDollarSign : kind === "borrow" ? ReceiptText : ClipboardList;
  return (
    <div className="flex items-center gap-3 border-b border-[var(--monari-line)] py-3.5 last:border-b-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f2f4] text-[#183d70]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-700 text-[var(--monari-ink)]">{title}</p>
        <p className="mt-0.5 text-[11px] text-[var(--monari-ink-muted)]">{sub}</p>
      </div>
      <p className="shrink-0 text-[14px] font-800 text-[var(--monari-ink)]">{value}</p>
    </div>
  );
}

function weekStart(today: string) {
  const date = new Date(today);
  date.setDate(date.getDate() - 6);
  return date.toISOString().slice(0, 10);
}
