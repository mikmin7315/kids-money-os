import Link from "next/link";
import { ActivityFeed, ChildSummaryList, TodaysBehaviorPanel } from "@/components/finance/dashboard-cards";
import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { EmptyState, HeroPill, MobileShell, PageContainer, PageHero, Section, Surface } from "@/components/ui/primitives";
import { getAuthContext } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

export default async function HomePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [dashboard, bundle, auth] = await Promise.all([getDashboardView(), getAppDataBundle(), getAuthContext()]);
  const primaryChild = dashboard.children[0];
  const pendingBehaviors = bundle.behaviorLogs.filter((l) => l.status === "pending");
  const pendingBorrows = bundle.borrowRequests.filter((r) => r.status === "pending");
  const totalPending = pendingBehaviors.length + pendingBorrows.length;

  const todayItems = bundle.behaviorLogs
    .filter((item) => item.childId === primaryChild?.child.id && item.date === today)
    .map((log) => {
      const rule = bundle.behaviorRules.find((item) => item.id === log.behaviorRuleId);
      return {
        title: rule?.title ?? "행동",
        reward: rule?.rewardAmount ?? 0,
        status: log.status,
        needsApproval: rule?.requiresParentApproval ?? false,
      };
    });

  const isDemo = !auth.user;

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader
          eyebrow="Monari"
          title={`${dashboard.parent.name}님, 안녕하세요`}
          right={<HeaderActions />}
        />

        <PageHero
          eyebrow="오늘의 흐름"
          title={
            totalPending > 0 ? (
              <>확인 대기 중인<br />내용이 {totalPending}건 있어요</>
            ) : (
              <>약속과 돈의 흐름이<br />잘 이어지고 있어요</>
            )
          }
          description={
            totalPending > 0
              ? "아이가 요청하거나 약속을 지킨 내용이 있어요. 확인해주세요."
              : "오늘은 대기 중인 확인 요청이 없어요. 아이의 약속 현황을 살펴보세요."
          }
          stats={
            <div className="grid grid-cols-3 gap-3">
              <HeroPill label="확인 대기" value={`${totalPending}`} />
              <HeroPill label="연결 자녀" value={`${dashboard.children.length}명`} />
              <HeroPill label="이번달 약속" value={`${bundle.behaviorLogs.length}건`} />
            </div>
          }
        />

        {isDemo && (
          <div className="mt-4 rounded-[20px] border border-[rgba(87,70,49,0.08)] bg-amber-50/60 px-4 py-3">
            <p className="text-xs font-medium text-amber-700">
              지금은 데모 모드예요. 로그인하면 실제 데이터로 연결됩니다.
            </p>
            <Link href="/login" className="mt-2 inline-flex text-xs font-semibold text-amber-800 underline underline-offset-2">
              로그인하러 가기 →
            </Link>
          </div>
        )}

        {totalPending > 0 && (
          <Section title="지금 확인할 내용" description="아이가 기다리고 있어요. 먼저 확인해주세요.">
            <Link
              href="/approvals"
              className="flex items-center justify-between rounded-[24px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(135deg,rgba(255,248,236,0.98),rgba(255,242,210,0.92))] px-5 py-4 transition-opacity hover:opacity-90"
            >
              <div>
                <p className="font-display text-base font-semibold">
                  {pendingBehaviors.length > 0 && `약속 확인 ${pendingBehaviors.length}건`}
                  {pendingBehaviors.length > 0 && pendingBorrows.length > 0 && " · "}
                  {pendingBorrows.length > 0 && `미리쓰기 요청 ${pendingBorrows.length}건`}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">탭해서 확인하러 가기</p>
              </div>
              <span className="text-xl">→</span>
            </Link>
          </Section>
        )}

        {primaryChild ? (
          <>
            <Section title="오늘 약속" description="오늘 체크된 약속과 보상을 같이 볼 수 있어요.">
              <TodaysBehaviorPanel items={todayItems} />
            </Section>

            <Section title="이번달 흐름" description="이번달에 어떤 선택이 있었는지 한눈에 봐요.">
              <Surface>
                <div className="grid grid-cols-2 gap-3">
                  <MonthBox label="용돈" value={formatWon(primaryChild.monthReport.totalAllowance)} />
                  <MonthBox label="지출" value={formatWon(primaryChild.monthReport.totalSpend)} />
                  <MonthBox label="남긴 돈" value={formatWon(primaryChild.monthReport.totalSave)} emoji="🐷" />
                  <MonthBox label="약속 달성률" value={`${primaryChild.monthReport.behaviorSuccessRate.toFixed(0)}%`} emoji="🌟" />
                </div>
                <Link
                  href="/reports"
                  className="mt-4 flex items-center justify-between text-sm font-medium text-[var(--color-accent)]"
                >
                  <span>자세한 리포트 보기</span>
                  <span>→</span>
                </Link>
              </Surface>
            </Section>
          </>
        ) : (
          <Section title="시작하기">
            <EmptyState
              message="아직 등록된 아이가 없어요."
              hint="아이를 등록하면 약속, 용돈, 이자가 연결됩니다."
              action={
                <Link href="/settings" className="inline-flex h-11 items-center rounded-full bg-[var(--color-accent)] px-5 text-sm font-bold text-[var(--color-accent-fg)]">
                  아이 등록하러 가기 →
                </Link>
              }
            />
          </Section>
        )}

        <Section title="자녀 현황" description="아이 모드로 전환하거나 통장 현황을 확인해요.">
          <div className="mb-3">
            <Link
              href="/child-mode"
              className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/60 px-4 py-2.5 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
            >
              아이 모드로 보기
            </Link>
          </div>
          <ChildSummaryList summaries={dashboard.children} />
        </Section>

        <Section title="최근 활동" description="약속과 돈의 흐름을 함께 볼 수 있어요.">
          <ActivityFeed items={dashboard.activityFeed} />
        </Section>
      </MobileShell>
      <BottomNav pathname="/" />
    </PageContainer>
  );
}

function MonthBox({ label, value, emoji }: { label: string; value: string; emoji?: string }) {
  return (
    <div className="rounded-[22px] border border-[rgba(87,70,49,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(239,228,210,0.9))] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">
        {emoji && <span className="mr-1">{emoji}</span>}{label}
      </p>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
