import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  ReceiptText,
  Smartphone,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AppNavShell, PageHero, PageContent } from "@/components/monari/app-nav-shell";
import { requireAppConsent } from "@/lib/auth";
import { getAppDataBundle, getDashboardView } from "@/lib/data";
import { getParentWalletAction } from "@/actions/parent-wallet";
import { formatWon, maskAccountNumber } from "@/lib/format";
import { NotificationBell } from "@/components/notifications/notification-bell";

export const dynamic = "force-dynamic";

const CHILD_COLORS = [
  { bg: "linear-gradient(135deg,#6C3FE8,#8B5CF6)", dot: "#6C3FE8" },
  { bg: "linear-gradient(135deg,#EC4899,#F43F5E)", dot: "#EC4899" },
  { bg: "linear-gradient(135deg,#0D9488,#0EA5E9)", dot: "#0D9488" },
  { bg: "linear-gradient(135deg,#D97706,#F59E0B)", dot: "#D97706" },
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

  const incompleteItems = bundle.children.flatMap((child) => {
    const items: { childName: string; label: string; href: string }[] = [];
    if (!bundle.allowanceRules.find((r) => r.childId === child.id))
      items.push({ childName: child.name, label: "용돈 설정", href: "/manage?tab=allowance" });
    if (!bundle.interestPolicies.find((p) => p.childId === child.id))
      items.push({ childName: child.name, label: "이자율 설정", href: "/settings/interest" });
    return items;
  });
  if (bundle.behaviorRules.length === 0)
    incompleteItems.push({ childName: "", label: "행동 약속 설정", href: "/behaviors" });

  const totalSave = dashboard.children.reduce((s, c) => s + c.monthReport.totalSave, 0);
  const behaviorsDone = bundle.behaviorLogs.filter((l) => l.status === "approved").length;
  const behaviorsTotal = bundle.behaviorLogs.length;

  const now = new Date();
  const nextSettlement = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysLeft = Math.ceil((nextSettlement.getTime() - now.getTime()) / 86400000);

  const firstName = dashboard.parent.name.split(" ")[0] || dashboard.parent.name;

  const recentFeed = dashboard.activityFeed.slice(0, 4).map((item) => {
    const childName = dashboard.children.find((c) => c.child.id === item.childId)?.child.name;
    return { ...item, sub: `${childName ?? "가족"} · ${item.date === today ? "오늘" : item.date.slice(5).replace("-", ".")}` };
  });

  return (
    <AppNavShell pendingCount={totalPending}>
      {/* ── 히어로 ── */}
      <PageHero>
        <div className="relative flex items-start justify-between mb-1">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-white/60">
            {now.getFullYear()}년 {now.getMonth() + 1}월
          </p>
          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        </div>

        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white">
          {firstName}님 👋
        </h1>

        {/* 부모 지갑 잔액 */}
        <div className="mt-4 mb-5">
          <p className="text-[11px] font-semibold text-white/60 mb-1">부모 지갑 잔액</p>
          <div className="flex items-end justify-between">
            <p className="text-[36px] font-black leading-none tracking-tight tabular-nums text-white">
              {formatWon(parentWallet?.balance ?? 0)}
            </p>
            <Link
              href="/settings/wallet"
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-[12px] font-bold text-white transition active:scale-[0.96]"
            >
              <Wallet className="h-3.5 w-3.5" /> 충전
            </Link>
          </div>
        </div>

        {/* 요약 Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            이달 저금 {formatWon(totalSave)}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white">
            약속 {behaviorsDone}/{behaviorsTotal}건
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/70">
            정산 D-{daysLeft}
          </span>
        </div>
      </PageHero>

      <PageContent className="pt-4 space-y-4">
        {/* 대기 배너 */}
        {totalPending > 0 && (
          <Link
            href="/approvals"
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition active:scale-[0.98]"
            style={{ background: "#FFFBEB", border: "1px solid #FCD34D" }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[13px] font-black text-white">
              {totalPending}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-amber-900">승인 대기 중인 요청이 있어요</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {pendingBehaviors.length > 0 && `약속 ${pendingBehaviors.length}건`}
                {pendingBehaviors.length > 0 && pendingBorrows.length > 0 && " · "}
                {pendingBorrows.length > 0 && `미리쓰기 ${pendingBorrows.length}건`}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-600 shrink-0" />
          </Link>
        )}

        {/* 미설정 배너 */}
        {incompleteItems.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #FCD34D", background: "#FFFBEB" }}>
            <div className="flex items-center gap-2 px-4 pt-3 pb-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-white">!</span>
              <p className="text-[13px] font-bold text-amber-900">아직 설정하지 않은 항목이 있어요</p>
            </div>
            <div className="px-4 pb-3 space-y-1.5">
              {incompleteItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 transition active:bg-white"
                >
                  <span className="text-[13px] font-semibold text-amber-900">
                    {item.childName && <span className="text-amber-600 mr-1.5">{item.childName}</span>}
                    {item.label}
                  </span>
                  <span className="text-[11px] font-bold text-amber-600">설정하기 →</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 아이 카드 섹션 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-[var(--monari-ink)]">우리 아이</h2>
            <Link href="/child-mode" className="text-[12px] font-bold text-[var(--monari-hero)]">아이 모드 →</Link>
          </div>

          <div className="space-y-3">
            {dashboard.children.map((summary, i) => {
              const color = CHILD_COLORS[i % CHILD_COLORS.length];
              const childBehaviors = bundle.behaviorLogs.filter((l) => l.childId === summary.child.id);
              const achieved = childBehaviors.filter((l) => l.status === "approved").length;
              const achieveRate = childBehaviors.length > 0 ? Math.round((achieved / childBehaviors.length) * 100) : 0;
              const hasIncomplete = incompleteItems.some((it) => it.childName === summary.child.name);

              return (
                <div
                  key={summary.child.id}
                  className="rounded-2xl bg-white overflow-hidden"
                  style={{
                    border: hasIncomplete ? "1.5px solid #FCD34D" : "1px solid var(--monari-line)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.07)"
                  }}
                >
                  <Link href={`/child/${summary.child.id}`} className="flex items-center gap-3 px-4 py-3.5 transition active:bg-[var(--monari-bg)]">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[17px] font-black text-white"
                      style={{ background: color.bg }}
                    >
                      {summary.child.name[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-[var(--monari-ink)]">{summary.child.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold text-[var(--monari-hero)]">이자율 {summary.wallet.currentInterestRate}%</span>
                        <span className="text-[10px] text-[var(--monari-ink-muted)]">약속 달성 {achieveRate}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[19px] font-black tracking-tight tabular-nums text-[var(--monari-ink)]">
                        {formatWon(summary.wallet.balance)}
                      </p>
                    </div>
                  </Link>

                  {/* 달성률 바 */}
                  <div className="px-4 pb-3">
                    <div className="h-1.5 w-full rounded-full bg-[var(--monari-bg)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${achieveRate}%`, background: color.bg }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-[var(--monari-line)] grid grid-cols-2">
                    <Link
                      href={`/child/${summary.child.id}/give-allowance`}
                      className="flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold text-emerald-600 border-r border-[var(--monari-line)] transition active:bg-emerald-50"
                    >
                      <CircleDollarSign className="h-4 w-4" /> 용돈 주기
                    </Link>
                    <Link
                      href={`/child-pin/${summary.child.id}`}
                      className="flex items-center justify-center gap-1.5 py-3 text-[13px] font-bold text-[var(--monari-hero)] transition active:bg-[var(--monari-hero-lo)]"
                    >
                      <Smartphone className="h-4 w-4" /> 아이 모드
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 최근 활동 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-[var(--monari-ink)]">최근 활동</h2>
            <Link href="/records" className="text-[12px] font-bold text-[var(--monari-hero)]">전체 보기 →</Link>
          </div>
          <div className="rounded-2xl bg-white overflow-hidden" style={{ border: "1px solid var(--monari-line)", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
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
                <p className="text-4xl mb-3">🌱</p>
                <p className="text-[15px] font-bold text-[var(--monari-ink)]">아직 활동이 없어요</p>
                <p className="mt-1 text-[13px] text-[var(--monari-ink-muted)]">용돈을 주거나 약속을 만들어보세요</p>
              </div>
            )}
          </div>
        </section>

        {/* 모나리 플러스 배너 */}
        {auth.user && (() => {
          const isPremium = (auth.profile as { subscription_tier?: string } | null)?.subscription_tier === "plus";
          return isPremium ? null : (
            <Link
              href="/settings/subscription"
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#7C3AED0D,#9333EA06)", border: "1.5px solid #7C3AED25" }}
            >
              <Sparkles size={20} className="text-[var(--monari-hero)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[var(--monari-ink)]">모나리 플러스로 업그레이드</p>
                <p className="text-[12px] text-[var(--monari-ink-muted)]">또래 비교 리포트 · 월 3,900원</p>
              </div>
              <ArrowRight size={16} className="text-[var(--monari-ink-muted)] shrink-0" />
            </Link>
          );
        })()}
      </PageContent>
    </AppNavShell>
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
      className={`flex items-center gap-3 px-4 py-3.5 transition active:bg-[var(--monari-bg)] ${!isLast ? "border-b border-[var(--monari-line)]" : ""}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[var(--monari-hero-lo)] text-[var(--monari-hero)]">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[var(--monari-ink)]">{title}</p>
        <p className="mt-0.5 text-[11px] text-[var(--monari-ink-muted)]">{sub}</p>
      </div>
      <p className={`shrink-0 text-[14px] font-bold ${isNeg ? "text-rose-600" : "text-emerald-600"}`}>
        {value}
      </p>
    </Link>
  );
}
