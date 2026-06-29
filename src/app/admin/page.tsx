import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Section, Surface, Badge } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/data";
import { formatWon } from "@/lib/format";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AdminStats = {
  totalParents: number;
  totalAdmins: number;
  totalChildren: number;
  totalTransactions: number;
  pendingBehaviorLogs: number;
  pendingBorrowRequests: number;
  totalBalance: number;
  totalSavings: number;
  totalBorrowed: number;
  recentTransactions: RecentTransaction[];
  recentBorrowRequests: RecentBorrowRequest[];
};

type RecentTransaction = {
  id: string;
  childName: string;
  type: string;
  amount: number;
  memo: string;
  date: string;
};

type RecentBorrowRequest = {
  id: string;
  childName: string;
  amount: number;
  purpose: string;
  createdAt: string;
};

const emptyStats: AdminStats = {
  totalParents: 0,
  totalAdmins: 0,
  totalChildren: 0,
  totalTransactions: 0,
  pendingBehaviorLogs: 0,
  pendingBorrowRequests: 0,
  totalBalance: 0,
  totalSavings: 0,
  totalBorrowed: 0,
  recentTransactions: [],
  recentBorrowRequests: [],
};

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const hasServiceRole = hasSupabaseEnv() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { stats, loadError } = hasServiceRole
    ? await loadAdminStats()
    : { stats: emptyStats, loadError: "Supabase service role key is not configured." };

  const pendingTotal = stats.pendingBehaviorLogs + stats.pendingBorrowRequests;

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin" title="운영 대시보드" />

        <section className="mt-6">
          <Surface className="bg-[linear-gradient(135deg,rgba(255,248,236,0.98),rgba(232,244,240,0.92))]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">Monari Admin</p>
                <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                  오늘 확인할 운영 상태
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  계정, 아이 통장, 승인 대기 건을 한 화면에서 점검합니다.
                </p>
              </div>
              <Badge tone={loadError ? "rose" : "emerald"}>{loadError ? "확인 필요" : "정상"}</Badge>
            </div>

            {loadError ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                운영 데이터를 불러오지 못했습니다. 환경변수와 Supabase service role 설정을 확인하세요.
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-3 gap-3">
                <StatChip label="부모" value={`${stats.totalParents}`} />
                <StatChip label="아이" value={`${stats.totalChildren}`} />
                <StatChip label="대기" value={`${pendingTotal}`} tone={pendingTotal > 0 ? "amber" : "emerald"} />
              </div>
            )}
          </Surface>
        </section>

        <Section title="운영 지표" description="서비스 상태를 숫자로 빠르게 확인합니다.">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="관리자" value={`${stats.totalAdmins}명`} hint="admin 권한 계정" />
            <MetricCard label="거래 기록" value={`${stats.totalTransactions}건`} hint="전체 돈 기록" />
            <MetricCard label="확인할 약속" value={`${stats.pendingBehaviorLogs}건`} hint="아이 행동 승인 대기" />
            <MetricCard label="미리쓰기 요청" value={`${stats.pendingBorrowRequests}건`} hint="부모 승인 대기" />
          </div>
        </Section>

        <Section title="아이 통장 합계" description="전체 아이 계정의 현재 금액 흐름입니다.">
          <Surface>
            <div className="space-y-3">
              <MoneyRow label="사용 가능 잔액" value={formatWon(stats.totalBalance)} tone="emerald" />
              <MoneyRow label="저금 중" value={formatWon(stats.totalSavings)} tone="sky" />
              <MoneyRow label="빌린 돈" value={formatWon(stats.totalBorrowed)} tone={stats.totalBorrowed > 0 ? "amber" : "neutral"} />
            </div>
          </Surface>
        </Section>

        <Section title="최근 거래" description="가장 최근에 기록된 돈 움직임입니다.">
          <Surface>
            {stats.recentTransactions.length === 0 ? (
              <EmptyAdminState>아직 거래 기록이 없습니다.</EmptyAdminState>
            ) : (
              <div className="space-y-3">
                {stats.recentTransactions.map((item) => (
                  <ActivityRow
                    key={item.id}
                    title={`${item.childName} · ${transactionLabel(item.type)}`}
                    description={item.memo || item.date}
                    value={formatWon(item.amount)}
                  />
                ))}
              </div>
            )}
          </Surface>
        </Section>

        <Section title="미리쓰기 대기" description="승인 전인 요청만 따로 봅니다.">
          <Surface>
            {stats.recentBorrowRequests.length === 0 ? (
              <EmptyAdminState>대기 중인 미리쓰기 요청이 없습니다.</EmptyAdminState>
            ) : (
              <div className="space-y-3">
                {stats.recentBorrowRequests.map((item) => (
                  <ActivityRow
                    key={item.id}
                    title={`${item.childName} · ${formatWon(item.amount)}`}
                    description={item.purpose || "사용 목적 없음"}
                    value="대기"
                  />
                ))}
              </div>
            )}
          </Surface>
        </Section>

        <Section title="관리 메뉴">
          <div className="space-y-3">
            <MenuCard
              href="/admin/announcements"
              title="공지/점검 관리"
              description="공지사항과 점검 안내를 작성하고 게시합니다."
              badge="A-N-01"
            />
            <MenuCard
              href="/admin/parents"
              title="부모 계정 목록"
              description="전체 부모 계정 · 아이 수 · 지갑 잔액을 한 번에 확인합니다."
              badge="A-02L"
            />
            <MenuCard
              href="/admin/children"
              title="아이 계정 목록"
              description="전체 아이 계정 · 잔액 · 저금 · 이자율 현황을 확인합니다."
              badge="A-03L"
            />
            <MenuCard
              href="/admin/settlement"
              title="정산 결과 / 배치 로그"
              description="월별 이자 정산 결과와 아이별 성공/실패 내역을 확인합니다."
              badge="A-I-04"
            />
            <MenuCard
              href="/admin/allowance-log"
              title="용돈 배치 로그"
              description="정기 용돈 실행 이력 및 미지급 실패 내역을 확인합니다."
              badge="A-14"
            />
            <MenuCard
              href="/admin/roles"
              title="역할 관리"
              description="사용자 계정을 parent 또는 admin으로 변경합니다."
              badge="RBAC"
            />
            <MenuCard
              href="/admin/wallet-charges"
              title="충전 요청 관리"
              description="부모 지갑 충전 요청을 확인하고 승인합니다."
              badge="A-W-01"
            />
            <MenuCard
              href="/approvals"
              title="승인 대기 보기"
              description="부모 화면에서 약속과 미리쓰기 요청을 처리합니다."
              badge="승인"
            />
            <MenuCard
              href="/"
              title="부모 대시보드"
              description="일반 사용자 홈 화면으로 이동합니다."
              badge="홈"
            />
          </div>
        </Section>

        <Section title="시스템 상태">
          <Surface>
            <div className="space-y-2 text-sm text-[var(--color-muted)]">
              <StatusRow label="Supabase 공개 환경변수" ok={hasSupabaseEnv()} />
              <StatusRow label="Supabase service role" ok={hasServiceRole} />
              <div className="flex items-center justify-between gap-3">
                <span>월말 정산 Edge Function</span>
                <Badge tone="sky">monthly-settlement</Badge>
              </div>
            </div>
          </Surface>
        </Section>
      </MobileShell>
    </PageContainer>
  );
}

async function loadAdminStats(): Promise<{ stats: AdminStats; loadError: string | null }> {
  try {
    const admin = getSupabaseAdminClient();
    const [
      parentsRes,
      adminsRes,
      childrenRes,
      transactionsRes,
      pendingBehaviorRes,
      pendingBorrowRes,
      walletsRes,
      recentTransactionsRes,
      recentBorrowsRes,
      childrenNamesRes,
    ] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "parent"),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
      admin.from("children").select("id", { count: "exact", head: true }),
      admin.from("money_transactions").select("id", { count: "exact", head: true }),
      admin.from("behavior_logs").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("borrow_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("wallet_snapshots").select("balance, savings_balance, borrowed_balance"),
      admin
        .from("money_transactions")
        .select("id, child_id, type, amount, memo, tx_date, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      admin
        .from("borrow_requests")
        .select("id, child_id, requested_amount, purpose, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
      admin.from("children").select("id, name"),
    ]);

    const firstError = [
      parentsRes.error,
      adminsRes.error,
      childrenRes.error,
      transactionsRes.error,
      pendingBehaviorRes.error,
      pendingBorrowRes.error,
      walletsRes.error,
      recentTransactionsRes.error,
      recentBorrowsRes.error,
      childrenNamesRes.error,
    ].find(Boolean);

    if (firstError) throw firstError;

    const childNames = new Map(
      (childrenNamesRes.data ?? []).map((child) => [String(child.id), String(child.name)]),
    );

    const walletTotals = (walletsRes.data ?? []).reduce(
      (totals, wallet) => ({
        balance: totals.balance + Number(wallet.balance ?? 0),
        savings: totals.savings + Number(wallet.savings_balance ?? 0),
        borrowed: totals.borrowed + Number(wallet.borrowed_balance ?? 0),
      }),
      { balance: 0, savings: 0, borrowed: 0 },
    );

    return {
      stats: {
        totalParents: parentsRes.count ?? 0,
        totalAdmins: adminsRes.count ?? 0,
        totalChildren: childrenRes.count ?? 0,
        totalTransactions: transactionsRes.count ?? 0,
        pendingBehaviorLogs: pendingBehaviorRes.count ?? 0,
        pendingBorrowRequests: pendingBorrowRes.count ?? 0,
        totalBalance: walletTotals.balance,
        totalSavings: walletTotals.savings,
        totalBorrowed: walletTotals.borrowed,
        recentTransactions: (recentTransactionsRes.data ?? []).map((row) => ({
          id: String(row.id),
          childName: childNames.get(String(row.child_id)) ?? "알 수 없는 아이",
          type: String(row.type),
          amount: Number(row.amount ?? 0),
          memo: String(row.memo ?? ""),
          date: String(row.tx_date ?? row.created_at ?? ""),
        })),
        recentBorrowRequests: (recentBorrowsRes.data ?? []).map((row) => ({
          id: String(row.id),
          childName: childNames.get(String(row.child_id)) ?? "알 수 없는 아이",
          amount: Number(row.requested_amount ?? 0),
          purpose: String(row.purpose ?? ""),
          createdAt: String(row.created_at ?? ""),
        })),
      },
      loadError: null,
    };
  } catch (error) {
    return {
      stats: emptyStats,
      loadError: error instanceof Error ? error.message : "Unknown admin stats error.",
    };
  }
}

function StatChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-[var(--color-text)]";

  return (
    <div className="rounded-[22px] border border-[rgba(87,70,49,0.08)] bg-white/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className={`mt-2 font-display text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Surface className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">{label}</p>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-[var(--color-text)]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{hint}</p>
    </Surface>
  );
}

function MoneyRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "sky" | "emerald" | "amber";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/65 px-4 py-3">
      <span className="text-sm font-semibold text-[var(--color-muted)]">{label}</span>
      <Badge tone={tone}>{value}</Badge>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <Badge tone={ok ? "emerald" : "rose"}>{ok ? "연결됨" : "확인 필요"}</Badge>
    </div>
  );
}

function ActivityRow({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white/65 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">{description}</p>
      </div>
      <span className="shrink-0 text-sm font-bold text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function EmptyAdminState({ children }: { children: string }) {
  return <p className="rounded-2xl bg-white/65 px-4 py-5 text-center text-sm text-[var(--color-muted)]">{children}</p>;
}

function MenuCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <Link href={href}>
      <Surface className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))] transition hover:bg-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
          </div>
          <Badge tone="sky">{badge}</Badge>
        </div>
      </Surface>
    </Link>
  );
}

function transactionLabel(type: string) {
  const labels: Record<string, string> = {
    allowance: "용돈",
    reward: "보상",
    spend: "사용",
    save: "저금",
    unsave: "저금 해제",
    borrow: "미리쓰기",
    repay: "갚기",
    interest: "이자",
  };

  return labels[type] ?? type;
}
