import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle } from "lucide-react";
import { requireParentSession } from "@/lib/auth";
import { getLatestInterestReport } from "@/actions/settlement-report";
import { formatWon } from "@/lib/format";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InterestReportPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const auth = await requireParentSession();
  if (!auth.user) redirect("/login");

  const result = await getLatestInterestReport(childId);

  if (!result.ok || !result.data) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--monari-bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 20px 0" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--monari-ink-muted)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            <ArrowLeft size={16} /> 홈으로
          </Link>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📊</div>
          <p style={{ fontSize: 16, color: "var(--monari-ink-muted)" }}>아직 정산 기록이 없어요.<br />매월 1일 자동 정산됩니다.</p>
        </div>
      </div>
    );
  }

  const d = result.data;
  const rateUp = d.rateDelta > 0;
  const rateDown = d.rateDelta < 0;
  const rateStay = d.rateDelta === 0;

  const achievedRules = d.ruleResults.filter((r) => r.achieved && r.interestDelta > 0);
  const missedRules = d.ruleResults.filter((r) => !r.achieved && r.interestDelta > 0);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--monari-bg)" }}>
      {/* 헤더 */}
      <div style={{ padding: "20px 20px 0" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--monari-ink-muted)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          <ArrowLeft size={16} /> 홈으로
        </Link>
      </div>

      <div style={{ padding: "20px 20px 32px" }}>
        {/* 타이틀 */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "var(--monari-ink-muted)", marginBottom: 4 }}>
            {d.childName} · {d.year}년 {d.month}월 정산
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", margin: 0 }}>
            이자율 리포트
          </h1>
        </div>

        {/* 이자율 변동 카드 */}
        <div style={{
          background: rateUp ? "linear-gradient(135deg, #7c3aed, #9333ea)"
            : rateDown ? "linear-gradient(135deg, #dc2626, #ef4444)"
            : "linear-gradient(135deg, #475569, #64748b)",
          borderRadius: 24,
          padding: "28px 24px",
          marginBottom: 16,
          color: "#fff",
        }}>
          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
            {d.year}년 {d.month}월 이자율
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>이전</p>
              <p style={{ fontSize: 32, fontWeight: 900 }}>{d.prevRate}%</p>
            </div>
            <div style={{ fontSize: 28, opacity: 0.7 }}>→</div>
            <div>
              <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>적용</p>
              <p style={{ fontSize: 40, fontWeight: 900 }}>{d.newRate}%</p>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "center" }}>
              {rateUp && <TrendingUp size={40} />}
              {rateDown && <TrendingDown size={40} />}
              {rateStay && <Minus size={40} />}
              <p style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>
                {rateUp ? `+${d.rateDelta}%` : rateDown ? `${d.rateDelta}%` : "변동없음"}
              </p>
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 14,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>이달 이자 수령</p>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{formatWon(d.totalInterest)}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>행동 달성률</p>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{d.overallAchievementRate}%</p>
            </div>
          </div>
        </div>

        {/* 이자율 변동 이유 */}
        {(achievedRules.length > 0 || missedRules.length > 0) && (
          <div style={{
            background: "var(--monari-surface)",
            borderRadius: 20,
            padding: "20px",
            marginBottom: 16,
            border: "1px solid var(--monari-line)",
          }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--monari-ink)", marginBottom: 16 }}>
              왜 이자율이 바뀌었나요?
            </p>

            {achievedRules.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--monari-done)", marginBottom: 8 }}>
                  ✅ 달성해서 올라간 약속
                </p>
                {achievedRules.map((r) => (
                  <div key={r.ruleId} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "var(--monari-done-bg)",
                    borderRadius: 12,
                    marginBottom: 6,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircle2 size={16} color="var(--monari-done)" />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink)", margin: 0 }}>{r.title}</p>
                        <p style={{ fontSize: 11, color: "var(--monari-ink-muted)", margin: 0 }}>
                          {r.ruleCategory === "monthly_goal"
                            ? `월 1회 달성`
                            : `${r.approvedCount}/${r.totalAttempts}회 (${r.achievementRate}%)`}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--monari-hero)" }}>
                      +{r.interestDelta}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            {missedRules.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--monari-minus)", marginBottom: 8 }}>
                  ❌ 달성 못해서 못 올린 약속
                </p>
                {missedRules.map((r) => (
                  <div key={r.ruleId} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "var(--monari-minus-bg)",
                    borderRadius: 12,
                    marginBottom: 6,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <XCircle size={16} color="var(--monari-minus)" />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink)", margin: 0 }}>{r.title}</p>
                        <p style={{ fontSize: 11, color: "var(--monari-ink-muted)", margin: 0 }}>
                          {r.ruleCategory === "monthly_goal"
                            ? `이번 달 미달성`
                            : `${r.approvedCount}/${r.totalAttempts}회 (${r.achievementRate}% / 목표 ${r.monthlyTargetRate}%)`}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink-muted)" }}>
                      +{r.interestDelta}% 못받음
                    </span>
                  </div>
                ))}
              </div>
            )}

            {d.ruleResults.length === 0 && (
              <p style={{ fontSize: 14, color: "var(--monari-ink-muted)" }}>설정된 행동 약속이 없어요.</p>
            )}
          </div>
        )}

        {/* 다음 달 안내 */}
        <div style={{
          background: "var(--monari-hero-lo)",
          borderRadius: 16,
          padding: "16px",
          marginBottom: 24,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--monari-hero)", marginBottom: 4 }}>
            💡 다음 달에는?
          </p>
          <p style={{ fontSize: 13, color: "var(--monari-ink)", lineHeight: 1.6 }}>
            {missedRules.length > 0
              ? `'${missedRules[0].title}' 등 ${missedRules.length}개 약속을 지키면 최대 +${missedRules.reduce((s, r) => s + r.interestDelta, 0).toFixed(1)}% 더 받을 수 있어요!`
              : achievedRules.length > 0
              ? "모든 약속을 달성했어요! 이 페이스를 유지해봐요."
              : "행동 약속을 설정하면 이자율을 높일 수 있어요."}
          </p>
        </div>

        <Link
          href={`/child/${childId}/interest`}
          style={{
            display: "block",
            textAlign: "center",
            padding: "14px",
            background: "var(--monari-surface)",
            border: "2px solid var(--monari-line)",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--monari-ink)",
            textDecoration: "none",
          }}
        >
          이자 히스토리 전체 보기 →
        </Link>
      </div>
    </div>
  );
}
