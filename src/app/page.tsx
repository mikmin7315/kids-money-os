import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  ReceiptText,
  Smartphone,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { MobileAppShell } from "@/components/monari/mobile-app-shell";
import { requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { getParentWalletAction } from "@/actions/parent-wallet";
import { formatWon, maskAccountNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const CHILD_COLORS = [
  { bg: "linear-gradient(135deg,#6C3FE8,#8B5CF6)", shadow: "rgba(108,63,232,0.35)" },
  { bg: "linear-gradient(135deg,#EC4899,#F43F5E)", shadow: "rgba(236,72,153,0.30)" },
  { bg: "linear-gradient(135deg,#0D9488,#0EA5E9)", shadow: "rgba(13,148,136,0.30)" },
  { bg: "linear-gradient(135deg,#D97706,#F59E0B)", shadow: "rgba(217,119,6,0.30)" },
];

export default async function HomePage() {
  const today = new Date().toISOString().slice(0, 10);
  const auth = await requireAppConsent();
  const [dashboard, bundle, parentWallet] = await Promise.all([
    getDashboardView(),
    getAppDataBundle(),
    getParentWalletAction().catch(() => null),
  ]);

  if (bundle.children.length === 0) redirect("/setup/1");

  const pendingBehaviors = bundle.behaviorLogs.filter((l) => l.status === "pending");
  const pendingBorrows = bundle.borrowRequests.filter((r) => r.status === "pending");
  const totalPending = pendingBehaviors.length + pendingBorrows.length;

  // 미설정 항목 감지
  const incompleteItems = bundle.children.flatMap((child) => {
    const items: { childName: string; label: string; href: string }[] = [];
    if (!bundle.allowanceRules.find((r) => r.childId === child.id))
      items.push({ childName: child.name, label: "용돈 설정", href: "/settings" });
    if (!bundle.interestPolicies.find((p) => p.childId === child.id))
      items.push({ childName: child.name, label: "이자율 설정", href: "/settings" });
    return items;
  });
  if (bundle.behaviorRules.length === 0)
    incompleteItems.push({ childName: "", label: "행동 약속 설정", href: "/behaviors" });

  const totalSave = dashboard.children.reduce((s, c) => s + c.monthReport.totalSave, 0);

  // 약속 달성 (이달 전체)
  const behaviorsDone = bundle.behaviorLogs.filter((l) => l.status === "approved").length;
  const behaviorsTotal = bundle.behaviorLogs.length;

  // 최근 활동
  const recentFeed = dashboard.activityFeed.slice(0, 3).map((item) => {
    const childName = dashboard.children.find((c) => c.child.id === item.childId)?.child.name;
    return { ...item, sub: `${childName ?? "가족"} · ${item.date === today ? "오늘" : item.date.slice(5).replace("-", ".")}` };
  });

  // 정산까지 남은 날
  const now = new Date();
  const nextSettlement = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysLeft = Math.ceil((nextSettlement.getTime() - now.getTime()) / 86400000);

  const firstName = dashboard.parent.name.split(" ")[0] || dashboard.parent.name;

  return (
    <MobileAppShell
      title={`${firstName}님 👋`}
      subtitle="안녕하세요"
      pendingCount={totalPending}
    >
      {/* ── 벤토 그리드 ── */}
      <div className="grid grid-cols-2 gap-3 mb-4">

        {/* 1. 부모 지갑 히어로 (full-width) */}
        <div
          className="col-span-2 rounded-[24px] p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(145deg,#0A1628 0%,#0A2463 50%,#0055B3 100%)", boxShadow: "0 12px 36px rgba(0,36,99,0.40)" }}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute right-8 bottom-0 h-20 w-20 rounded-full bg-white/06" />

          <div className="relative flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] font-700 tracking-[0.08em] uppercase text-white/60 mb-1">부모 지갑 잔액</p>
              <p className="text-[38px] font-900 leading-none tracking-[-0.04em] tabular-nums text-white">
                {formatWon(parentWallet?.balance ?? 0)}
              </p>
            </div>
            <Link
              href="/settings/wallet"
              className="flex items-center gap-1.5 rounded-[12px] bg-white/20 px-3 py-2 text-[12px] font-800 text-white transition active:scale-[0.96]"
            >
              <Wallet className="h-3.5 w-3.5" /> 충전
            </Link>
          </div>

          <div className="relative flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-700 text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#86efac]" />
              이자율 {dashboard.children[0]?.wallet.currentInterestRate ?? 0}%
            </span>
            <span className="text-[12px] font-600 text-white/55">정산 D-{daysLeft}</span>
            {parentWallet?.bankName && (
              <span className="ml-auto text-[11px] font-600 text-white/40">
                {maskAccountNumber(parentWallet.accountNumber)}
              </span>
            )}
          </div>
        </div>

        {/* 2. 아이 카드들 */}
        {dashboard.children.length > 0 ? (
          dashboard.children.map((summary, i) => {
            const color = CHILD_COLORS[i % CHILD_COLORS.length];
            const childBehaviors = bundle.behaviorLogs.filter((l) => l.childId === summary.child.id);
            const achieved = childBehaviors.filter((l) => l.status === "approved").length;
            const achieveRate = childBehaviors.length > 0 ? Math.round((achieved / childBehaviors.length) * 100) : 0;
            const childIncomplete = incompleteItems.filter((it) => it.childName === summary.child.name);
            const hasIncomplete = childIncomplete.length > 0;

            return (
              <Link
                key={summary.child.id}
                href={`/child/${summary.child.id}`}
                className="rounded-[20px] bg-[var(--monari-surface)] p-4 shadow-[var(--monari-shadow-md)] transition active:scale-[0.97]"
                style={hasIncomplete ? { border: "2px solid var(--monari-pending)", boxShadow: "0 0 0 3px rgba(180,83,9,0.08)" } : {}}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="relative shrink-0">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-[11px] text-[14px] font-900 text-white"
                      style={{ background: color.bg, boxShadow: `0 3px 10px ${color.shadow}` }}
                    >
                      {summary.child.name[0]}
                    </span>
                    {hasIncomplete && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--monari-pending)] text-[9px] font-900 text-white">!</span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-800 text-[var(--monari-ink)] leading-tight">{summary.child.name}</p>
                    <p className="text-[10px] font-700 text-[var(--monari-hero)]">{summary.wallet.currentInterestRate}%</p>
                  </div>
                </div>
                <p className="text-[22px] font-900 tracking-[-0.03em] tabular-nums text-[var(--monari-ink)] leading-none mb-2">
                  {formatWon(summary.wallet.balance)}
                </p>
                {/* 달성률 바 */}
                <div className="h-1.5 w-full rounded-full bg-[var(--monari-hero-lo)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${achieveRate}%`, background: color.bg }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] font-700 text-[var(--monari-ink-muted)]">약속 달성 {achieveRate}%</p>
              </Link>
            );
          })
        ) : (
          <Link
            href="/settings"
            className="col-span-2 rounded-[20px] bg-[var(--monari-surface)] p-5 shadow-[var(--monari-shadow-md)] flex items-center justify-between transition active:scale-[0.98]"
          >
            <div>
              <p className="text-[15px] font-800 text-[var(--monari-ink)]">첫 아이 통장 만들기</p>
              <p className="mt-1 text-[12px] text-[var(--monari-ink-muted)]">용돈·약속·저축을 한곳에서</p>
            </div>
            <ArrowRight className="h-5 w-5 text-[var(--monari-hero)]" />
          </Link>
        )}

        {/* 3. 이달 저금 */}
        <div className="rounded-[20px] p-4" style={{ background: "var(--status-success-solid)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-700 text-[var(--status-success-solid-text)] tracking-[0.04em] uppercase">이달 저금</p>
            <TrendingUp className="h-4 w-4 text-[var(--monari-done)]" />
          </div>
          <p className="text-[24px] font-900 tracking-[-0.03em] tabular-nums text-[var(--status-success-solid-text)] leading-none">
            {formatWon(totalSave)}
          </p>
        </div>

        {/* 4. 약속 달성 */}
        <div className="rounded-[20px] p-4 bg-[var(--monari-hero-lo)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-700 text-[var(--monari-hero)] tracking-[0.04em] uppercase">약속 달성</p>
            <CheckCircle2 className="h-4 w-4 text-[var(--monari-hero)]" />
          </div>
          <p className="text-[24px] font-900 tracking-[-0.03em] tabular-nums text-[var(--monari-hero)] leading-none">
            {behaviorsDone}<span className="text-[14px] font-700 text-[var(--monari-ink-muted)]"> / {behaviorsTotal}</span>
          </p>
        </div>

        {/* 5. 승인 대기 알림 (full-width, 있을 때만) */}
        {totalPending > 0 && (
          <Link
            href="/approvals"
            className="col-span-2 rounded-[20px] flex items-center gap-3 px-4 py-3.5 transition active:scale-[0.98]"
            style={{ background: "var(--status-pending-solid)" }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-[12px] font-900 text-white"
            >
              {totalPending}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-800 text-[var(--status-pending-solid-text)]">승인 대기 중인 요청</p>
              <p className="text-[11px] text-[var(--monari-pending)] mt-0.5">
                {pendingBehaviors.length > 0 && `약속 ${pendingBehaviors.length}건`}
                {pendingBehaviors.length > 0 && pendingBorrows.length > 0 && " · "}
                {pendingBorrows.length > 0 && `미리쓰기 ${pendingBorrows.length}건`}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--monari-pending)] shrink-0" />
          </Link>
        )}

      </div>

      {/* ── 미설정 항목 배너 ── */}
      {incompleteItems.length > 0 && (
        <section className="mb-4 rounded-[20px] overflow-hidden" style={{ border: "2px solid var(--monari-pending)", background: "var(--status-pending-solid)" }}>
          <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--monari-pending)] text-[11px] font-900 text-white">!</span>
            <p className="text-[13px] font-800 text-[var(--status-pending-solid-text)]">아직 설정하지 않은 항목이 있어요</p>
          </div>
          <div className="px-4 pb-3.5 space-y-2">
            {incompleteItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center justify-between rounded-[12px] bg-white/60 px-3 py-2.5 transition active:bg-white/80"
              >
                <div>
                  {item.childName && (
                    <span className="text-[10px] font-700 text-[var(--monari-pending)] mr-1.5">{item.childName}</span>
                  )}
                  <span className="text-[13px] font-700 text-[var(--status-pending-solid-text)]">{item.label}</span>
                </div>
                <span className="text-[11px] font-700 text-[var(--monari-pending)]">설정하기 →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── 아이 모드 빠른 이동 ── */}
      {dashboard.children.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center justify-between px-1 mb-2.5">
            <h2 className="text-[16px] font-800 text-[var(--monari-ink)]">아이 통장</h2>
            <Link href="/child-mode" className="text-[12px] font-700 text-[var(--monari-hero)]">아이 모드 →</Link>
          </div>
          <div className="space-y-2">
            {dashboard.children.map((summary, i) => {
              const color = CHILD_COLORS[i % CHILD_COLORS.length];
              return (
                <div key={summary.child.id} className="rounded-[20px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden">
                  <Link href={`/child/${summary.child.id}`} className="flex items-center gap-3 px-4 py-3 transition active:scale-[0.99]">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[16px] font-900 text-white"
                      style={{ background: color.bg, boxShadow: `0 3px 10px ${color.shadow}` }}
                    >
                      {summary.child.name[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-700 text-[var(--monari-ink)]">{summary.child.name}</p>
                      <p className="text-[12px] text-[var(--monari-ink-muted)] mt-0.5">저축 {formatWon(summary.wallet.savingsBalance)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[18px] font-800 tracking-[-0.02em] tabular-nums text-[var(--monari-ink)]">{formatWon(summary.wallet.balance)}</p>
                      <p className="text-[11px] font-600 text-[var(--monari-hero)] mt-0.5">열기 →</p>
                    </div>
                  </Link>
                  <div className="border-t border-[var(--monari-line)] grid grid-cols-2">
                    <Link
                      href={`/child/${summary.child.id}/give-allowance`}
                      className="flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-800 text-[var(--monari-done)] border-r border-[var(--monari-line)] transition active:bg-[var(--status-success-solid)]"
                    >
                      <CircleDollarSign className="h-4 w-4" /> 용돈 주기
                    </Link>
                    <Link
                      href={`/child-pin/${summary.child.id}`}
                      className="flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-800 text-[var(--monari-hero)] transition active:bg-[var(--monari-hero-lo)]"
                    >
                      <Smartphone className="h-4 w-4" /> 아이 모드
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 최근 활동 ── */}
      <section className="mb-5">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <h2 className="text-[16px] font-800 text-[var(--monari-ink)]">최근 활동</h2>
          <Link href="/records" className="text-[12px] font-700 text-[var(--monari-hero)]">전체 보기 →</Link>
        </div>
        <div className="rounded-[20px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden">
          {recentFeed.length > 0 ? (
            recentFeed.map((item, i) => (
              <RecentRow
                key={item.id}
                href="/records"
                title={item.title}
                sub={item.sub}
                value={item.amount != null ? `${item.accent === "rose" || item.accent === "amber" ? "-" : "+"}${formatWon(item.amount)}` : item.description}
                kind={item.kind}
                isLast={i === recentFeed.length - 1}
              />
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-[32px]">🌱</p>
              <p className="mt-2 text-[15px] font-700 text-[var(--monari-ink)]">아직 활동이 없어요</p>
              <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">용돈을 주거나 약속을 만들어보세요</p>
            </div>
          )}
        </div>
      </section>

      {!auth.user && (
        <div className="mb-4 rounded-[20px] bg-[var(--monari-surface)] p-4 shadow-[var(--monari-shadow-md)] flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-800 text-[var(--monari-ink)]">지금은 체험 모드예요</p>
            <p className="mt-0.5 text-[12px] text-[var(--monari-ink-muted)]">로그인하면 가족 기록이 안전하게 저장됩니다.</p>
          </div>
          <Link href="/login" className="monari-btn-primary h-10 shrink-0 px-4 text-[13px]">로그인</Link>
        </div>
      )}
    </MobileAppShell>
  );
}

function RecentRow({ href, title, sub, value, kind, isLast }: {
  href: string; title: string; sub: string; value: string; kind: string; isLast: boolean;
}) {
  const Icon = kind === "money" ? CircleDollarSign : kind === "borrow" ? ReceiptText : ClipboardList;
  const isNeg = value.startsWith("-");
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3.5 transition active:bg-[var(--monari-hero-lo)] ${!isLast ? "border-b border-[var(--monari-line)]" : ""}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-700 text-[var(--monari-ink)]">{title}</p>
        <p className="mt-0.5 text-[11px] text-[var(--monari-ink-muted)]">{sub}</p>
      </div>
      <p className={`shrink-0 text-[14px] font-800 ${isNeg ? "text-[var(--status-rose-solid-text)]" : "text-[var(--monari-done)]"}`}>
        {value}
      </p>
    </Link>
  );
}
