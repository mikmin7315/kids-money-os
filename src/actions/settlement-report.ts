"use server";

import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BehaviorRuleCategory, BehaviorLogStatus } from "@/lib/types";

type InterestEventRow = {
  applied_rate: number | string;
  rate_delta: number | string;
  effective_date: string;
};

type BehaviorScoreRow = {
  year: number;
  month: number;
  computed_score: number | string;
};

type MonthlyReportRow = { total_interest: number | string | null };
type ChildRow = { name: string; parent_id: string };
type WalletRow = {
  current_interest_rate: number | string | null;
  savings_balance: number | string | null;
};
type BehaviorRuleRow = {
  id: string;
  title: string;
  interest_delta: number | string;
  rule_category: BehaviorRuleCategory;
  monthly_target_rate: number | null;
};
type BehaviorLogRow = {
  behavior_rule_id: string;
  status: BehaviorLogStatus;
};

export type BehaviorRuleResult = {
  ruleId: string;
  title: string;
  interestDelta: number;
  totalAttempts: number;
  approvedCount: number;
  achievementRate: number;
  achieved: boolean;
  monthlyTargetRate: number;
  ruleCategory: BehaviorRuleCategory;
};

export type ChildInterestReport = {
  childId: string;
  childName: string;
  year: number;
  month: number;
  prevRate: number;
  newRate: number;
  rateDelta: number;
  overallAchievementRate: number;
  ruleResults: BehaviorRuleResult[];
  totalInterest: number;
  savingsBalance: number;
  settledAt: string | null;
};

type InterestReportResult =
  | { ok: true; data: ChildInterestReport }
  | { ok: false; error: string };

export async function getLatestInterestReport(childId: string): Promise<InterestReportResult> {
  try {
    const auth = await requireParentSession();
    if (!auth.user) return { ok: false, error: "로그인이 필요합니다." };

    const supabase = await getSupabaseServerClient();
    const { data: childData, error: childError } = await supabase
      .from("children")
      .select("name,parent_id")
      .eq("id", childId)
      .maybeSingle();
    if (childError) throw childError;

    const child = childData as ChildRow | null;
    if (!child || child.parent_id !== auth.user.id) {
      return { ok: false, error: "아이 정보를 찾을 수 없습니다." };
    }

    const [{ data: eventData, error: eventError }, { data: scoreData, error: scoreError }] =
      await Promise.all([
        supabase
          .from("interest_rate_events")
          .select("applied_rate,rate_delta,effective_date")
          .eq("child_id", childId)
          .order("effective_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("behavior_scores")
          .select("year,month,computed_score")
          .eq("child_id", childId)
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
    if (eventError) throw eventError;
    if (scoreError) throw scoreError;

    const event = eventData as InterestEventRow | null;
    const score = scoreData as BehaviorScoreRow | null;
    if (!score) return { ok: false, error: "정산 기록이 없습니다." };

    const year = Number(score.year);
    const month = Number(score.month);
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

    const [reportResult, walletResult, rulesResult, logsResult] = await Promise.all([
      supabase
        .from("monthly_reports")
        .select("total_interest")
        .eq("child_id", childId)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle(),
      supabase
        .from("wallet_snapshots")
        .select("current_interest_rate,savings_balance")
        .eq("child_id", childId)
        .maybeSingle(),
      supabase
        .from("behavior_rules")
        .select("id,title,interest_delta,rule_category,monthly_target_rate")
        .eq("parent_id", auth.user.id)
        .eq("is_active", true),
      supabase
        .from("behavior_logs")
        .select("behavior_rule_id,status")
        .eq("child_id", childId)
        .gte("behavior_date", firstDay)
        .lte("behavior_date", lastDay),
    ]);

    for (const error of [reportResult.error, walletResult.error, rulesResult.error, logsResult.error]) {
      if (error) throw error;
    }

    const report = reportResult.data as MonthlyReportRow | null;
    const wallet = walletResult.data as WalletRow | null;
    const rules = (rulesResult.data ?? []) as BehaviorRuleRow[];
    const logs = (logsResult.data ?? []) as BehaviorLogRow[];
    const logsByRule = new Map<string, BehaviorLogRow[]>();
    for (const log of logs) {
      const ruleLogs = logsByRule.get(log.behavior_rule_id) ?? [];
      ruleLogs.push(log);
      logsByRule.set(log.behavior_rule_id, ruleLogs);
    }

    const ruleResults = rules.map((rule): BehaviorRuleResult => {
      const ruleLogs = logsByRule.get(rule.id) ?? [];
      const approvedCount = ruleLogs.filter((log) => log.status === "approved").length;
      const achievementRate = ruleLogs.length > 0
        ? Math.round((approvedCount / ruleLogs.length) * 100)
        : 0;
      const monthlyTargetRate = Number(rule.monthly_target_rate ?? 80);

      return {
        ruleId: rule.id,
        title: rule.title,
        interestDelta: Number(rule.interest_delta),
        totalAttempts: ruleLogs.length,
        approvedCount,
        achievementRate,
        achieved: rule.rule_category === "monthly_goal"
          ? approvedCount >= 1
          : achievementRate >= monthlyTargetRate,
        monthlyTargetRate,
        ruleCategory: rule.rule_category,
      };
    });

    const newRate = event
      ? Number(event.applied_rate)
      : Number(wallet?.current_interest_rate ?? 0);
    const rateDelta = event ? Number(event.rate_delta) : 0;

    return {
      ok: true,
      data: {
        childId,
        childName: child.name,
        year,
        month,
        prevRate: newRate - rateDelta,
        newRate,
        rateDelta,
        overallAchievementRate: Math.round(Number(score.computed_score ?? 0)),
        ruleResults,
        totalInterest: Number(report?.total_interest ?? 0),
        savingsBalance: Number(wallet?.savings_balance ?? 0),
        settledAt: event?.effective_date ?? null,
      },
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "오류가 발생했습니다." };
  }
}
