import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getLatestInterestReport } from "@/actions/settlement-report";
import { formatWon } from "@/lib/format";

export async function InterestReportCard({ childId, childName }: { childId: string; childName: string }) {
  const result = await getLatestInterestReport(childId);
  if (!result.ok || !result.data) return null;

  const d = result.data;
  const rateUp = d.rateDelta > 0;
  const rateDown = d.rateDelta < 0;

  return (
    <Link
      href={`/reports/interest/${childId}`}
      style={{ display: "block", textDecoration: "none" }}
    >
      <div style={{
        background: "var(--monari-surface)",
        border: "1px solid var(--monari-line)",
        borderRadius: 20,
        padding: "16px 18px",
        marginBottom: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--monari-ink-muted)", margin: "0 0 2px" }}>
              {childName} · {d.year}년 {d.month}월 이자율 리포트
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: "var(--monari-ink)" }}>
                {d.prevRate}% → {d.newRate}%
              </span>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 13,
                fontWeight: 800,
                color: rateUp ? "var(--monari-done)" : rateDown ? "var(--monari-minus)" : "var(--monari-ink-muted)",
                background: rateUp ? "var(--monari-done-bg)" : rateDown ? "var(--monari-minus-bg)" : "var(--monari-line)",
                borderRadius: 8,
                padding: "2px 8px",
              }}>
                {rateUp ? <TrendingUp size={13} /> : rateDown ? <TrendingDown size={13} /> : <Minus size={13} />}
                {rateUp ? `+${d.rateDelta}%` : rateDown ? `${d.rateDelta}%` : "변동없음"}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "var(--monari-ink-muted)", margin: "0 0 2px" }}>이달 이자</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: "var(--monari-hero)", margin: 0 }}>
              +{formatWon(d.totalInterest)}
            </p>
          </div>
        </div>

        {/* 달성률 바 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "var(--monari-ink-muted)" }}>행동 달성률</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--monari-ink)" }}>{d.overallAchievementRate}%</span>
          </div>
          <div style={{ height: 5, background: "var(--monari-line)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${d.overallAchievementRate}%`,
              background: d.overallAchievementRate >= 80 ? "var(--monari-done)" : "var(--monari-pending)",
              borderRadius: 99,
            }} />
          </div>
        </div>

        <p style={{ fontSize: 11, color: "var(--monari-hero)", fontWeight: 600, marginTop: 8, textAlign: "right" }}>
          자세히 보기 →
        </p>
      </div>
    </Link>
  );
}
