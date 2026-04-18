import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RecordList } from "@/components/records/record-list";
import { MobileShell, NavLink, PageContainer, Section, Surface } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";

export default async function RecordsPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="타임라인" title="날짜별 기록" right={<HeaderActions />} />

        <Section title="보기 모드" description="리스트 모드 우선 출시. 캘린더는 같은 데이터 구조를 재사용합니다.">
          <Surface>
            <div className="flex gap-2">
              <NavLink href="/records" label="리스트 보기" active />
              <NavLink href="/records" label="캘린더 (예정)" />
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
              날짜 기준 추적이 중요하지만, 메인 홈은 캘린더일 필요가 없습니다.
            </p>
          </Surface>
        </Section>

        <Section title="전체 타임라인" description="행동, 용돈, 지출, 저축, 미리쓰기를 하나의 날짜 피드로.">
          <RecordList
            transactions={bundle.moneyTransactions}
            behaviorLogs={bundle.behaviorLogs}
            behaviorRules={bundle.behaviorRules}
            borrowRequests={bundle.borrowRequests}
          />
        </Section>
      </MobileShell>
      <BottomNav pathname="/records" />
    </PageContainer>
  );
}
