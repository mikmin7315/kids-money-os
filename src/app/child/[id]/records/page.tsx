import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";
import type { TransactionType } from "@/lib/types";

export const dynamic = "force-dynamic";

const MINUS_TYPES: TransactionType[] = ["spend", "repay", "unsave"];

const TX_META: Record<TransactionType, { label: string; emoji: string; color: string; bg: string }> = {
  allowance: { label: "용돈",      emoji: "💵", color: "var(--status-info-solid-text)",    bg: "var(--status-info-solid)" },
  reward:    { label: "보상",      emoji: "🏅", color: "var(--monari-hero)",               bg: "var(--monari-hero-lo)" },
  interest:  { label: "이자",      emoji: "✨", color: "var(--monari-done)",               bg: "var(--status-success-solid)" },
  save:      { label: "저금",      emoji: "🐷", color: "var(--status-info-solid-text)",    bg: "var(--status-info-solid)" },
  unsave:    { label: "저금 인출", emoji: "↩️", color: "var(--monari-primary-strong)",     bg: "var(--status-pending-solid)" },
  spend:     { label: "사용",      emoji: "🛍️", color: "var(--status-rose-solid-text)",    bg: "var(--status-rose-solid)" },
  borrow:    { label: "미리쓰기",  emoji: "🤝", color: "var(--status-rose-solid-text)",    bg: "var(--status-rose-solid)" },
  repay:     { label: "상환",      emoji: "💳", color: "var(--status-danger-solid-text)",  bg: "var(--status-pending-solid)" },
};

function txLabel(type: TransactionType, memo?: string) {
  const base = TX_META[type]?.label ?? type;
  return memo && memo !== base ? memo : base;
}

function relativeDate(date: string, today: string) {
  if (date === today) return "오늘";
  const diff = Math.round((new Date(today).getTime() - new Date(date).getTime()) / 86400000);
  if (diff === 1) return "어제";
  if (diff < 7) return `${diff}일 전`;
  return date.slice(5).replace("-", "월 ") + "일";
}

export default async function ChildRecordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([getChildModeContext(), getAppDataBundle()]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

  const txs = bundle.moneyTransactions
    .filter((t) => t.childId === id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const totalIn  = txs.filter((t) => !MINUS_TYPES.includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter((t) =>  MINUS_TYPES.includes(t.type)).reduce((s, t) => s + t.amount, 0);

  const grouped: Record<string, typeof txs> = {};
  for (const tx of txs) (grouped[tx.date] ??= []).push(tx);
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="detail-shell">
      <Link href={`/child/${id}`} className="detail-back">
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      <p className="detail-eyebrow">{child.name}의 통장</p>
      <h1 className="detail-title">거래 내역</h1>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="detail-card" style={{ marginBottom: 0, padding: "18px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--monari-ink-muted)", marginBottom: 6 }}>들어온 돈</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "var(--monari-done)", letterSpacing: "-0.02em" }} className="tabular-nums">
            +{formatWon(totalIn)}
          </p>
        </div>
        <div className="detail-card" style={{ marginBottom: 0, padding: "18px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--monari-ink-muted)", marginBottom: 6 }}>나간 돈</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "var(--status-rose-solid-text)", letterSpacing: "-0.02em" }} className="tabular-nums">
            -{formatWon(totalOut)}
          </p>
        </div>
      </div>

      {txs.length === 0 ? (
        <div className="detail-card" style={{ padding: "48px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 52, marginBottom: 14 }}>🌱</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--monari-ink)" }}>아직 거래 내역이 없어요</p>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--monari-ink-muted)", marginTop: 8 }}>
            용돈을 받거나 쓰면 여기서 확인할 수 있어요.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {dates.map((date) => (
            <div key={date}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-ink-muted)", marginBottom: 8 }}>
                {relativeDate(date, today)} · {date.slice(5).replace("-", "월 ")}일
              </p>
              <div className="detail-card" style={{ marginBottom: 0 }}>
                {grouped[date].map((tx, i) => {
                  const minus = MINUS_TYPES.includes(tx.type);
                  const meta = TX_META[tx.type] ?? { emoji: "•", color: "var(--monari-ink-soft)", bg: "#f3f4f6", label: tx.type };
                  return (
                    <div
                      key={tx.id}
                      className="detail-row"
                      style={{ borderBottom: i === grouped[date].length - 1 ? "none" : undefined }}
                    >
                      <span
                        className="flex items-center justify-center rounded-[14px]"
                        style={{ width: 44, height: 44, background: meta.bg, fontSize: 20, flexShrink: 0 }}
                      >
                        {meta.emoji}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="detail-row-label">{txLabel(tx.type, tx.memo)}</p>
                        <p className="detail-row-sub">{meta.label}</p>
                      </div>
                      <p
                        className="detail-row-value tabular-nums"
                        style={{ color: minus ? "#be123c" : "var(--monari-done)" }}
                      >
                        {minus ? "-" : "+"}{formatWon(tx.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
