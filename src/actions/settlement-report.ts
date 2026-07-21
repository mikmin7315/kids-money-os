"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireParentSession } from "@/lib/auth";

export type BehaviorRuleResult = {
  ruleId: string;
  title: string;
  interestDelta: number;
  totalAttempts: number;
  approvedCount: number;
  achievementRate: number;
  achieved: boolean;
  monthlyTargetRate: number;
  ruleCategory: "recurring" | "monthly_goal";
};

export type ChildInterestReport = {
  childId: string;
  childName: string;
  year: number;
  month: number;
  // 이자율
  prevRate: number;
  newRate: number;
  rateDelta: number;
  // 행동 달성
  overallAchievementRate: number;
  ruleResults: BehaviorRuleResult[];
  // 재무
  totalInterest: number;
  savingsBalance: number;
  // 정산 날짜
  settledAt: string | null;
};

export async function getLatestInterestReport(childId: string): Promise<{
  ok: boolean;
  data?: ChildInterestReport;
  error?: string;
}> {
  try {
    const auth = await requireParentSession();
    if (!auth.user) return { ok: false, error: "로그인 필요" };

    const sb = await getSupabaseServerClient();

    // 최신 interest_rate_event 조회
    const { data: event } = await sb
      .from("interest_rate_events")
      .select("*")
      .eq("child_id", childId)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single();

    // 최신 behavior_score 조회
    const { data: score } = await sb
      .from("behavior_scores")
      .select("*")
      .eq("child_id", childId)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(1)
      .single();

    if (!score) return { ok: false, error: "정산 기록이 없습니다." };

    const year = Number(score.year);
    const month = Number(score.month);

    // monthly_report 조회
    const { data: report } = await sb
      .from("monthly_reports")
      .select("total_interest")
      .eq("child_id", childId)
      .eq("year", year)
      .eq("month", month)
      .single();

    // 아이 정보
    const { data: child } = await sb
      .from("children")
      .select("name")
      .eq("id", childId)
      .single();

    // 현재 이자율 (wallet_snapshots)
    const { data: wallet } = await sb
      .from("wallet_snapshots")
      .select("current_interest_rate, savings_balance")
      .eq("child_id", childId)
      .single();

    // 해당 월의 behavior_logs + behavior_rules 조인
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);

    const { data: rules } = await sb
      .from("behavior_rules")
      .select("id, title, interest_delta, rule_category, monthly_target_rate")
      .eq("parent_id", auth.user.id)
      .eq("is_active", true);

    const ruleResults: BehaviorRuleResult[] = [];

    for (const rule of rules ?? []) {
      const { data: logs } = await sb
        .from("behavior_logs")
        .select("status")
        .eq("child_id", childId)
        .eq("behavior_rule_id", rule.id)
        .gte("behavior_date", firstDay)
        .lte("behavior_date", lastDay);

      const total = logs?.length ?? 0;
      const approved = logs?.filter((l) => l.status === "approved").length ?? 0;
      const achievementRate = total > 0 ? Math.round((approved / total) * 100) : 0;
      const targetRate = Number(rule.monthly_target_rate ?? 80);
      const achieved =
        rule.rule_category === "monthly_goal" ? approved >= 1 : achievementRate >= targetRate;

      ruleResults.push({
        ruleId: rule.id,
        title: String(rule.title),
        interestDelta: Number(rule.interest_delta),
        totalAttempts: total,
        approvedCount: approved,
        achievementRate,
        achieved,
        monthlyTargetRate: targetRate,
        ruleCategory: rule.rule_category as "recurring" | "monthly_goal",
      });
    }

    const appliedRate = event ? Number(event.applied_rate) : Number(wallet?.current_interest_rate ?? 0);
    const rateDelta = event ? Number(event.rate_delta) : 0;
    const prevRate = appliedRate - rateDelta;

    return {
      ok: true,
      data: {
        childId,
        childName: child?.name ?? "",
        year,
        month,
        prevRate,
        newRate: appliedRate,
        rateDelta,
        overallAchievementRate: Math.round(Number(score.computed_score ?? 0)),
        ruleResults,
        totalInterest: Number(report?.total_interest ?? 0),
        savingsBalance: Number(wallet?.savings_balance ?? 0),
        settledAt: event?.effective_date ?? null,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "오류" };
  }
}
