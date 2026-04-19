import { AppHeader, HeaderActions } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { RecordList } from "@/components/records/record-list";
import { HeroPill, MobileShell, PageContainer, PageHero, Section } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";

export default async function RecordsPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const pendingCount = bundle.behaviorLogs.filter((l) => l.status === "pending").length;

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="기록" title="흐름 기록" right={<HeaderActions />} />

        <PageHero
          eyebrow="약속과 돈의 타임라인"
          title={<>행동과 돈의 흐름을<br />함께 볼 수 있어요</>}
          description="약속, 용돈, 지출, 저축, 미리쓰기가 날짜 순으로 이어져요."
          stats={
            <div className="grid grid-cols-3 gap-3">
              <HeroPill label="전체 기록" value={`${bundle.moneyTransactions.length + bundle.behaviorLogs.length}건`} />
              <HeroPill label="거래" value={`${bundle.moneyTransactions.length}건`} />
              <HeroPill label="확인 대기" value={`${pendingCount}건`} />
            </div>
          }
        />

        <Section title="전체 타임라인" description="날짜 기준으로 모든 기록을 함께 볼 수 있어요.">
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
