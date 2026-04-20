import Link from "next/link";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { SectionTitle } from "@/components/monari/ui";
import { requireParentSession } from "@/lib/auth";
import { getDashboardView } from "@/lib/data";
import { formatWon } from "@/lib/format";

export default async function ChildModePage() {
  await requireParentSession();
  const dashboard = await getDashboardView();

  return (
    <MobileAppShell title="아이 프로필 선택" subtitle="아이 모드">
      {/* Hero */}
      <div className="monari-hero mb-4">
        <p className="text-[15px] font-800 text-white mb-1">아이 화면으로 전환</p>
        <p className="text-[13px] text-white/70">
          프로필을 선택하고 PIN을 입력하면 아이 전용 통장 화면으로 바로 들어갑니다.
        </p>
      </div>

      {/* How it works */}
      <section className="mb-4">
        <SectionTitle>사용 방법</SectionTitle>
        <div className="monari-card mt-3 p-4">
          <ul className="space-y-2 text-[13px] text-[var(--monari-ink-soft)]">
            <li>• 핸드폰을 아이에게 건넬 때 사용합니다.</li>
            <li>• 아이 카드를 탭하면 PIN 입력 화면으로 이동합니다.</li>
            <li>• PIN은 설정 화면에서 아이별로 설정할 수 있습니다.</li>
          </ul>
        </div>
      </section>

      {/* Child profiles */}
      <section className="mb-4">
        <SectionTitle>아이 프로필</SectionTitle>
        {dashboard.children.length === 0 ? (
          <div className="monari-card mt-3 px-4 py-5 text-center">
            <p className="text-[14px] font-600 text-[var(--monari-ink-muted)]">등록된 아이가 없어요</p>
            <p className="monari-meta mt-1 mb-4">설정 화면에서 아이를 추가해주세요.</p>
            <Link href="/settings" className="monari-btn-primary px-5 text-[13px]">설정으로 가기 →</Link>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {dashboard.children.map((summary) => (
              <Link
                key={summary.child.id}
                href={`/child-pin/${summary.child.id}`}
                className="monari-card flex items-center justify-between p-5 block"
              >
                <div>
                  <p className="text-[18px] font-800 text-[var(--monari-ink)]">{summary.child.name}</p>
                  <p className="monari-meta mt-0.5">{formatWon(summary.wallet.balance)}</p>
                  {summary.pendingApprovals > 0 && (
                    <p className="text-[12px] font-700 text-[var(--monari-pending)] mt-1">
                      확인 대기 {summary.pendingApprovals}건
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[var(--monari-hero)] font-700">→</span>
                  <span className="text-[11px] font-600 text-[var(--monari-ink-muted)]">PIN 입력</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </MobileAppShell>
  );
}
