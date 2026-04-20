import Link from "next/link";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle, ListRow, ProgressBar } from "@/components/monari/ui";
import { getAuthContext } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";
export default async function HomePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [dashboard, bundle, auth] = await Promise.all([getDashboardView(), getAppDataBundle(), getAuthContext()]);
  const pendingBehaviors = bundle.behaviorLogs.filter((l) => l.status === "pending");
  const pendingBorrows = bundle.borrowRequests.filter((r) => r.status === "pending");
  const totalPending = pendingBehaviors.length + pendingBorrows.length;

  const headline =
    totalPending > 0
      ? `오늘 확인할 내용이 ${totalPending}건 있어요`
      : "약속과 돈의 흐름이 잘 이어지고 있어요";

  const primary = dashboard.children[0];

  const accentToTone = (accent: string) => {
    if (accent === "emerald") return "done";
    if (accent === "amber") return "pending";
    if (accent === "rose") return "minus";
    return "plus";
  };

  const recentFeed = dashboard.activityFeed.slice(0, 4).map((item) => {
    const childName = dashboard.children.find((c) => c.child.id === item.childId)?.child.name;
    const dateLabel = item.date === today ? "오늘" : item.date.slice(5).replace("-", ".");
    return {
      title: item.title,
      sub: childName ? `${childName} · ${dateLabel}` : dateLabel,
      right: item.amount != null ? (item.accent === "rose" || item.accent === "amber" ? `-${formatWon(item.amount)}` : `+${formatWon(item.amount)}`) : item.description,
      tone: accentToTone(item.accent) as "done" | "pending" | "plus" | "minus" | "neutral",
    };
  });

  return (
    <MobileAppShell title={headline} subtitle={`${dashboard.parent.name}님 안녕하세요`}>
      {/* Hero */}
      <div className="monari-hero mb-4">
        <p className="text-[13px] font-700 text-white/70 mb-1">이번달 전체 흐름</p>
        {primary ? (
          <>
            <p className="text-[34px] font-800 leading-none tracking-tight text-white tabular-nums">
              {formatWon(primary.wallet.balance)}
            </p>
            <p className="mt-1 text-[13px] text-white/70">{primary.child.name} 잔액</p>
          </>
        ) : (
          <p className="text-[18px] font-700 text-white">아이를 등록해주세요</p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <HeroPill label="확인 대기" value={`${totalPending}건`} />
          <HeroPill label="연결 아이" value={`${dashboard.children.length}명`} />
          <HeroPill label="이번달 약속" value={`${bundle.behaviorLogs.length}건`} />
        </div>
      </div>

      {/* Pending alert */}
      {totalPending > 0 && (
        <Link
          href="/approvals"
          className="mb-4 flex items-center justify-between rounded-[20px] bg-[var(--monari-pending-bg)] border border-[var(--monari-pending)] px-4 py-3"
        >
          <div>
            <p className="text-[14px] font-700 text-[var(--monari-pending)]">
              {pendingBehaviors.length > 0 && `약속 ${pendingBehaviors.length}건`}
              {pendingBehaviors.length > 0 && pendingBorrows.length > 0 && " · "}
              {pendingBorrows.length > 0 && `미리쓰기 ${pendingBorrows.length}건`}
            </p>
            <p className="text-[12px] text-[var(--monari-pending)] opacity-80">탭해서 확인하기</p>
          </div>
          <span className="text-[var(--monari-pending)]">→</span>
        </Link>
      )}

      {/* Children summary */}
      {dashboard.children.length > 0 && (
        <section className="mb-4 space-y-3">
          <SectionTitle>자녀 현황</SectionTitle>
          <div className="space-y-3 mt-3">
            {dashboard.children.map((s) => {
              const successRate = s.monthReport.behaviorSuccessRate;
              return (
                <Link key={s.child.id} href={`/child/${s.child.id}`} className="monari-card block p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[16px] font-800 text-[var(--monari-ink)]">{s.child.name}</p>
                      <p className="monari-meta mt-0.5">{formatWon(s.wallet.balance)}</p>
                    </div>
                    <span className="text-[13px] font-700 text-[var(--monari-hero)]">보기 →</span>
                  </div>
                  <ProgressBar value={successRate} />
                  <p className="monari-meta mt-1.5">약속 달성 {successRate.toFixed(0)}%</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {dashboard.children.length === 0 && (
        <div className="monari-card p-5 mb-4 text-center">
          <p className="text-[15px] font-700 text-[var(--monari-ink)] mb-1">아직 등록된 아이가 없어요</p>
          <p className="monari-meta mb-4">아이를 등록하면 약속, 용돈, 이자가 연결됩니다.</p>
          <Link href="/settings" className="monari-btn-primary px-5">아이 등록하기 →</Link>
        </div>
      )}

      {/* Monthly summary */}
      {primary && (
        <section className="mb-4 space-y-3">
          <SectionTitle>이번달 흐름</SectionTitle>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <MonthTile label="용돈" value={formatWon(primary.monthReport.totalAllowance)} />
            <MonthTile label="지출" value={formatWon(primary.monthReport.totalSpend)} />
            <MonthTile label="저축" value={formatWon(primary.monthReport.totalSave)} />
            <MonthTile label="약속 달성" value={`${primary.monthReport.behaviorSuccessRate.toFixed(0)}%`} />
          </div>
        </section>
      )}

      {/* Recent activity */}
      {recentFeed.length > 0 && (
        <section className="mb-4">
          <SectionTitle>최근 활동</SectionTitle>
          <div className="monari-card mt-3 px-4 divide-y divide-[var(--monari-line)]">
            {recentFeed.map((item, i) => (
              <ListRow key={i} title={item.title} sub={item.sub} right={item.right} tone={item.tone} />
            ))}
          </div>
        </section>
      )}

      {!auth.user && (
        <div className="monari-card p-4 mb-4">
          <p className="text-[13px] text-[var(--monari-ink-soft)] mb-2">지금은 데모 모드예요. 로그인하면 실제 데이터로 연결됩니다.</p>
          <Link href="/login" className="monari-btn-primary text-[13px] px-4 h-9">로그인하기</Link>
        </div>
      )}
    </MobileAppShell>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-white/10 border border-white/15 px-2 py-2 gap-0.5">
      <p className="text-[11px] font-600 text-white/70">{label}</p>
      <p className="text-[14px] font-800 text-white">{value}</p>
    </div>
  );
}

function MonthTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="monari-card p-4">
      <p className="monari-meta">{label}</p>
      <p className="monari-kpi-value mt-1">{value}</p>
    </div>
  );
}
