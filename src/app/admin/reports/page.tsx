import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

function getKstMonthRange() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getUTCFullYear();
  const month = kst.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1) - 9 * 60 * 60 * 1000).toISOString();
  const end = new Date(Date.UTC(year, month + 1, 1) - 9 * 60 * 60 * 1000).toISOString();
  return { start, end, label: `${year}년 ${month + 1}월` };
}

async function loadStats() {
  try {
    const admin = getSupabaseAdminClient();
    const { start, end, label } = getKstMonthRange();

    const [
      childrenRes,
      walletsRes,
      txThisMonthRes,
      txAllowanceRes,
      txInterestRes,
      borrowPendingRes,
      behaviorRes,
      inquiryRes,
    ] = await Promise.all([
      admin.from("children").select("id", { count: "exact" }).is("deleted_at", null),
      admin.from("wallet_snapshots").select("balance, savings_balance, current_interest_rate"),
      admin.from("transactions").select("amount", { count: "exact" }).gte("created_at", start).lt("created_at", end),
      admin.from("transactions").select("amount").eq("type", "allowance").gte("created_at", start).lt("created_at", end),
      admin.from("transactions").select("amount").eq("type", "interest").gte("created_at", start).lt("created_at", end),
      admin.from("borrow_requests").select("amount", { count: "exact" }).eq("status", "pending"),
      admin.from("behavior_logs").select("achieved", { count: "exact" }).gte("logged_at", start).lt("logged_at", end),
      admin.from("inquiries").select("status", { count: "exact" }).eq("status", "pending"),
    ]);

    const totalChildren = childrenRes.count ?? 0;
    const totalBalance = (walletsRes.data ?? []).reduce((s, w) => s + Number(w.balance ?? 0), 0);
    const totalSavings = (walletsRes.data ?? []).reduce((s, w) => s + Number(w.savings_balance ?? 0), 0);
    const avgRate = walletsRes.data?.length
      ? (walletsRes.data.reduce((s, w) => s + Number(w.current_interest_rate ?? 0), 0) / walletsRes.data.length).toFixed(1)
      : "0";
    const txCount = txThisMonthRes.count ?? 0;
    const totalAllowance = (txAllowanceRes.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const totalInterest = (txInterestRes.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const pendingBorrows = borrowPendingRes.count ?? 0;
    const behaviorTotal = behaviorRes.count ?? 0;
    const behaviorAchieved = (behaviorRes.data ?? []).filter((r) => r.achieved).length;
    const behaviorRate = behaviorTotal > 0 ? Math.round((behaviorAchieved / behaviorTotal) * 100) : 0;
    const pendingInquiries = inquiryRes.count ?? 0;

    return { ok: true, label, totalChildren, totalBalance, totalSavings, avgRate, txCount, totalAllowance, totalInterest, pendingBorrows, behaviorRate, behaviorTotal, pendingInquiries };
  } catch {
    return { ok: false, label: "", totalChildren: 0, totalBalance: 0, totalSavings: 0, avgRate: "0", txCount: 0, totalAllowance: 0, totalInterest: 0, pendingBorrows: 0, behaviorRate: 0, behaviorTotal: 0, pendingInquiries: 0 };
  }
}

export default async function AdminReportsPage() {
  await requireAdminSession();
  const s = await loadStats();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 리포트" title="시스템 전체 리포트" />

        {!s.ok && (
          <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">데이터를 불러오지 못했습니다.</div>
        )}

        <p className="mb-4 text-sm font-semibold text-[var(--color-muted)]">{s.label} 기준 집계</p>

        {/* 전체 현황 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">아이 통장 전체 현황</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "활성 아이", value: `${s.totalChildren}명`, color: "text-[var(--color-text)]" },
              { label: "평균 이자율", value: `${s.avgRate}%`, color: "text-[var(--monari-hero)]" },
              { label: "총 잔액", value: formatWon(s.totalBalance), color: "text-[var(--monari-done)]" },
              { label: "총 저금", value: formatWon(s.totalSavings), color: "text-[var(--status-info-solid-text)]" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-[12px] bg-white p-4 shadow-[var(--monari-shadow-sm)]">
                <p className="text-[11px] font-semibold text-[var(--color-muted)]">{label}</p>
                <p className={`mt-1 text-lg font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 이달 활동 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">이달 활동</p>
          <div className="rounded-[16px] bg-white p-4 shadow-[var(--monari-shadow-md)] space-y-3">
            {[
              { label: "총 거래 건수", value: `${s.txCount}건` },
              { label: "용돈 지급 총액", value: formatWon(s.totalAllowance) },
              { label: "이자 지급 총액", value: formatWon(s.totalInterest) },
              { label: "행동 약속 달성률", value: `${s.behaviorRate}% (${s.behaviorTotal}건)` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-muted)]">{label}</span>
                <span className="text-sm font-bold text-[var(--color-text)]">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 운영 대기 현황 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">운영 대기 현황</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/approvals" className="rounded-[12px] bg-white p-4 shadow-[var(--monari-shadow-sm)] transition active:scale-[0.97]">
              <p className="text-[11px] font-semibold text-[var(--color-muted)]">승인 대기</p>
              <p className={`mt-1 text-2xl font-black ${s.pendingBorrows > 0 ? "text-[var(--monari-primary-strong)]" : "text-[var(--monari-done)]"}`}>{s.pendingBorrows}</p>
              <p className="text-[10px] text-[var(--color-muted)]">미리쓰기 건</p>
            </Link>
            <Link href="/admin/inquiries" className="rounded-[12px] bg-white p-4 shadow-[var(--monari-shadow-sm)] transition active:scale-[0.97]">
              <p className="text-[11px] font-semibold text-[var(--color-muted)]">미답변 문의</p>
              <p className={`mt-1 text-2xl font-black ${s.pendingInquiries > 0 ? "text-[var(--monari-minus)]" : "text-[var(--monari-done)]"}`}>{s.pendingInquiries}</p>
              <p className="text-[10px] text-[var(--color-muted)]">건</p>
            </Link>
          </div>
        </section>

        {/* 이달 행동 달성률 바 */}
        <section className="mb-5">
          <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">이달 행동 약속 달성률</p>
          <div className="rounded-[16px] bg-white p-4 shadow-[var(--monari-shadow-md)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--color-muted)]">전체 아이 평균</span>
              <span className="text-lg font-black text-[var(--monari-hero)]">{s.behaviorRate}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[var(--monari-surface-soft)]">
              <div
                className="h-2.5 rounded-full bg-[var(--monari-hero)] transition-all"
                style={{ width: `${Math.min(s.behaviorRate, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[var(--color-muted)]">총 {s.behaviorTotal}건 기록</p>
          </div>
        </section>

        <div className="mt-4 space-y-2">
          <Link href="/admin/transactions" className="block text-sm font-bold text-[var(--color-accent)]">거래내역 상세 →</Link>
          <Link href="/admin/settlement" className="block text-sm font-bold text-[var(--color-accent)]">정산 결과 →</Link>
          <Link href="/admin" className="block text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
