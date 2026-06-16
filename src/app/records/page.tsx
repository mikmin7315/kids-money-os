import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
import { RecordList } from "@/components/records/record-list";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RecordsPage() {
  await requireParentSession();
  const bundle = await getAppDataBundle();
  const pendingCount = bundle.behaviorLogs.filter((l) => l.status === "pending").length;
  const totalRecords = bundle.moneyTransactions.length + bundle.behaviorLogs.length;
  const moneyIn = bundle.moneyTransactions
    .filter((item) => !["spend", "repay", "unsave"].includes(item.type))
    .reduce((sum, item) => sum + item.amount, 0);
  const moneyOut = bundle.moneyTransactions
    .filter((item) => ["spend", "repay", "unsave"].includes(item.type))
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <MobileAppShell title="흐름 기록" subtitle="기록">
      {/* Hero */}
      <div className="monari-hero mb-4">
        <p className="text-[13px] font-700 text-white/70 mb-2">약속과 돈의 타임라인</p>
        <div className="relative mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-600 text-white/65">누적 순흐름</p>
            <p className="mt-1 text-[25px] font-800 tracking-[-0.04em] text-white">{formatWon(moneyIn - moneyOut)}</p>
          </div>
          <p className="max-w-[16ch] text-right text-[11px] leading-4 text-white/65">모든 아이의 기록을 합산한 금액이에요</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <HeroPill label="전체 기록" value={`${totalRecords}건`} />
          <HeroPill label="거래" value={`${bundle.moneyTransactions.length}건`} />
          <HeroPill label="확인 대기" value={`${pendingCount}건`} />
        </div>
      </div>

      <section className="mb-4">
        <SectionTitle>최근 활동</SectionTitle>
        <div className="mt-3">
          <RecordList
            transactions={bundle.moneyTransactions}
            behaviorLogs={bundle.behaviorLogs}
            behaviorRules={bundle.behaviorRules}
            borrowRequests={bundle.borrowRequests}
          />
        </div>
      </section>
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
