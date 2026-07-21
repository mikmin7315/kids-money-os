import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getLatestInterestReport } from "@/actions/settlement-report";
import { formatWon } from "@/lib/format";

export async function ChildInterestReportCard({ childId }: { childId: string }) {
  const result = await getLatestInterestReport(childId);
  if (!result.ok || !result.data) return null;

  const d = result.data;
  const rateUp = d.rateDelta > 0;
  const rateDown = d.rateDelta < 0;

  const emoji = rateUp ? "🎉" : rateDown ? "😢" : "😊";
  const headline = rateUp
    ? `이자율이 올랐어요!`
    : rateDown
    ? `이자율이 내려갔어요`
    : `이자율은 그대로예요`;

  return (
    <Link href={`/reports/interest/${childId}`} style={{ display: "block", textDecoration: "none", marginBottom: 16 }}>
      <div style={{
        background: rateUp
          ? "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
          : rateDown
          ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
          : "linear-gradient(135deg, #475569 0%, #64748b 100%)",
        borderRadius: 24,
        padding: "20px 20px",
        color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 28 }}>{emoji}</span>
          <div>
            <p style={{ fontSize: 11, opacity: 0.8, margin: "0 0 2px" }}>
              {d.year}년 {d.month}월 이자율 리포트
            </p>
            <p style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>{headline}</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 11, opacity: 0.7, margin: "0 0 2px" }}>이전</p>
            <p style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>{d.prevRate}%</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.8 }}>
            {rateUp ? <TrendingUp size={22} /> : rateDown ? <TrendingDown size={22} /> : <Minus size={22} />}
            <span style={{ fontSize: 13, fontWeight: 800 }}>
              {rateUp ? `+${d.rateDelta}%` : rateDown ? `${d.rateDelta}%` : "±0%"}
            </span>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 11, opacity: 0.7, margin: "0 0 2px" }}>새 이자율</p>
            <p style={{ fontSize: 34, fontWeight: 900, margin: 0 }}>{d.newRate}%</p>
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.18)",
          borderRadius: 14,
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
        }}>
          <div>
            <p style={{ fontSize: 11, opacity: 0.8, margin: "0 0 2px" }}>이달 이자 받은 돈</p>
            <p style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{formatWon(d.totalInterest)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, opacity: 0.8, margin: "0 0 2px" }}>약속 달성률</p>
            <p style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{d.overallAchievementRate}%</p>
          </div>
        </div>

        <p style={{ fontSize: 11, opacity: 0.7, textAlign: "right", marginTop: 8 }}>
          왜 바뀌었는지 보기 →
        </p>
      </div>
    </Link>
  );
}
