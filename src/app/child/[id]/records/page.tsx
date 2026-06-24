import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Landmark, PiggyBank, ReceiptText, TrendingUp } from "lucide-react";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { formatWon } from "@/lib/format";
import type { TransactionType } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<TransactionType, string> = {
  allowance: "용돈",
  reward: "약속 보상",
  spend: "사용",
  save: "저금",
  unsave: "저금 해제",
  borrow: "미리쓰기",
  repay: "갚기",
  interest: "이자",
};

const MINUS_TYPES: TransactionType[] = ["spend", "repay", "unsave"];

function TxIcon({ type }: { type: TransactionType }) {
  if (type === "save") return <PiggyBank className="h-4 w-4" />;
  if (MINUS_TYPES.includes(type)) return <ReceiptText className="h-4 w-4" />;
  if (type === "interest") return <TrendingUp className="h-4 w-4" />;
  return <Landmark className="h-4 w-4" />;
}

function txColor(type: TransactionType) {
  if (type === "save") return { bg: "#e9f2ff", text: "#2d67b2" };
  if (MINUS_TYPES.includes(type)) return { bg: "#fff0e9", text: "#d95d2d" };
  if (type === "interest") return { bg: "#f3e8ff", text: "#7c3aed" };
  return { bg: "#e7f8ed", text: "#238b51" };
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

  const txs = bundle.moneyTransactions
    .filter((t) => t.childId === id)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  // 날짜별 그룹핑
  const groups = txs.reduce<Record<string, typeof txs>>((acc, tx) => {
    (acc[tx.date] ??= []).push(tx);
    return acc;
  }, {});
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const totalIn = txs.filter((t) => !MINUS_TYPES.includes(t.type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter((t) => MINUS_TYPES.includes(t.type)).reduce((s, t) => s + t.amount, 0);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());

  return (
    <main className="px-4 pb-36 pt-8">
      <Link href={`/child/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#7c3aed]">
        <ArrowLeft size={16} /> 돌아가기
      </Link>

      <div className="mb-5">
        <p style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 4 }}>돈 기록</p>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a0533", letterSpacing: "-0.03em" }}>
          📒 내 돈 기록
        </h1>
      </div>

      {/* 요약 */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-[#e7f8ed] p-4">
          <p style={{ fontSize: 12, fontWeight: 600, color: "#238b51" }}>들어온 돈</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#065f46", marginTop: 4 }}>+{formatWon(totalIn)}</p>
        </div>
        <div className="rounded-[20px] bg-[#fff0e9] p-4">
          <p style={{ fontSize: 12, fontWeight: 600, color: "#d95d2d" }}>나간 돈</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#9a3412", marginTop: 4 }}>-{formatWon(totalOut)}</p>
        </div>
      </div>

      {/* 타임라인 */}
      {sortedDates.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <p style={{ fontSize: 48, marginBottom: 12 }}>📭</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: "#1a0533" }}>아직 기록이 없어요</p>
          <p className="mt-2" style={{ fontSize: 14, color: "#9ca3af" }}>용돈을 받으면 여기서 확인할 수 있어요!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedDates.map((date) => {
            const label =
              date === today
                ? "오늘"
                : date === new Date(new Date(today).setDate(new Date(today).getDate() - 1)).toISOString().slice(0, 10)
                ? "어제"
                : `${date.slice(5, 7)}월 ${date.slice(8)}일`;

            return (
              <div key={date}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>{label}</p>
                <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                  {groups[date].map((tx, i) => {
                    const isPlus = !MINUS_TYPES.includes(tx.type);
                    const color = txColor(tx.type);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 px-4 py-3.5"
                        style={{ borderTop: i > 0 ? "1px solid #f3f4f6" : undefined }}
                      >
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                          style={{ background: color.bg, color: color.text }}
                        >
                          <TxIcon type={tx.type} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#1a0533" }}>
                            {tx.memo || TYPE_LABEL[tx.type]}
                          </p>
                          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{TYPE_LABEL[tx.type]}</p>
                        </div>
                        <p
                          className="tabular-nums"
                          style={{ fontSize: 16, fontWeight: 800, color: isPlus ? "#059669" : "#d95d2d" }}
                        >
                          {isPlus ? "+" : "-"}{formatWon(tx.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
