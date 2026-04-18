import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);

  const { data: children, error: childrenErr } = await supabase
    .from("children")
    .select("id, birth_year, parent_id");

  if (childrenErr) {
    return new Response(JSON.stringify({ error: childrenErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results = [];

  for (const child of children ?? []) {
    const [walletRes, policyRes, logsRes] = await Promise.all([
      supabase.from("wallet_snapshots").select("*").eq("child_id", child.id).maybeSingle(),
      supabase.from("interest_policies").select("*").eq("child_id", child.id).maybeSingle(),
      supabase.from("behavior_logs")
        .select("status")
        .eq("child_id", child.id)
        .gte("behavior_date", `${monthKey}-01`)
        .lte("behavior_date", `${monthKey}-31`),
    ]);

    const wallet = walletRes.data;
    const policy = policyRes.data;
    if (!wallet || !policy) continue;

    // Behavior score
    const logs = logsRes.data ?? [];
    const totalAttempts = logs.length;
    const successCount = logs.filter((l) => l.status === "completed" || l.status === "approved").length;
    const computedScore = totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0;

    // Rate adjustment: +0.1% per 10% above 50% score, -0.1% per 10% below 50%
    const scoreDelta = computedScore - 50;
    const rateAdjustment = Math.round((scoreDelta / 10) * 0.1 * 100) / 100;
    const newRate = Math.min(
      policy.max_interest_rate,
      Math.max(policy.min_interest_rate, wallet.current_interest_rate + rateAdjustment),
    );

    // Savings interest
    const periodRate = policy.settlement_cycle === "monthly"
      ? wallet.current_interest_rate / 100 / 12
      : wallet.current_interest_rate / 100 / 52;
    const interestAmount = Math.round(wallet.savings_balance * periodRate);

    // Upsert behavior score
    await supabase.from("behavior_scores").upsert({
      child_id: child.id,
      year,
      month,
      total_attempts: totalAttempts,
      success_count: successCount,
      computed_score: computedScore,
      rate_adjustment: rateAdjustment,
    }, { onConflict: "child_id,year,month" });

    // Insert interest transaction if positive
    if (interestAmount > 0) {
      await supabase.from("money_transactions").insert({
        child_id: child.id,
        tx_date: lastDay,
        type: "interest",
        amount: interestAmount,
        savings_delta: 0,
        borrowed_delta: 0,
        memo: `${year}년 ${month}월 이자 정산`,
      });
    }

    // Insert interest rate event (triggers wallet_snapshots update via DB trigger)
    if (rateAdjustment !== 0) {
      await supabase.from("interest_rate_events").insert({
        child_id: child.id,
        rate_delta: rateAdjustment,
        applied_rate: newRate,
        reason: `${year}년 ${month}월 행동 점수 기반 이자율 조정 (성공률 ${computedScore.toFixed(0)}%)`,
        effective_date: lastDay,
      });
    }

    // Aggregate monthly report
    const { data: txs } = await supabase
      .from("money_transactions")
      .select("type, amount")
      .eq("child_id", child.id)
      .gte("tx_date", `${monthKey}-01`)
      .lte("tx_date", `${monthKey}-31`);

    const sumType = (type: string[]) =>
      (txs ?? []).filter((t) => type.includes(t.type)).reduce((s, t) => s + t.amount, 0);

    await supabase.from("monthly_reports").upsert({
      child_id: child.id,
      year,
      month,
      total_allowance: sumType(["allowance", "reward"]),
      total_spend: sumType(["spend"]),
      total_save: sumType(["save"]),
      total_interest: sumType(["interest"]),
      total_borrowed: sumType(["borrow"]),
      behavior_success_rate: computedScore,
    }, { onConflict: "child_id,year,month" });

    // Monthly settlement notification to parent
    await supabase.from("notifications").insert({
      parent_id: child.parent_id,
      child_id: child.id,
      target: "parent",
      type: "monthly_settlement",
      title: `${year}년 ${month}월 이자 정산 완료`,
      body: `행동 점수 ${computedScore.toFixed(0)}%, 이자 ${interestAmount.toLocaleString()}원 지급, 이자율 ${newRate}%로 조정됩니다.`,
    });

    // Monthly settlement notification to child
    await supabase.from("notifications").insert({
      parent_id: child.parent_id,
      child_id: child.id,
      target: "child",
      type: "monthly_settlement",
      title: `${year}년 ${month}월 이자가 들어왔어요!`,
      body: `이번 달 행동 점수 ${computedScore.toFixed(0)}점으로 이자 ${interestAmount.toLocaleString()}원을 받았어요.`,
    });

    results.push({
      childId: child.id,
      birthYear: child.birth_year,
      interestAmount,
      computedScore,
      rateAdjustment,
      savingsBalance: wallet.savings_balance,
      currentRate: newRate,
    });
  }

  // ── peer_stats aggregation ──────────────────────────────────
  // Group children into age bands based on current year
  const ageBand = (birthYear: number): string => {
    const age = year - birthYear;
    if (age <= 9) return "7-9";
    if (age <= 12) return "10-12";
    return "13-15";
  };

  type BandAccum = {
    scores: number[];
    rates: number[];
    savingsBalances: number[];
    count: number;
  };
  const bands = new Map<string, BandAccum>();

  for (const r of results) {
    const band = ageBand(r.birthYear);
    if (!bands.has(band)) bands.set(band, { scores: [], rates: [], savingsBalances: [], count: 0 });
    const b = bands.get(band)!;
    b.scores.push(r.computedScore);
    b.rates.push(r.currentRate);
    b.savingsBalances.push(r.savingsBalance);
    b.count++;
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  for (const [band, b] of bands) {
    // Savings rate = avg savings / (avg savings + a proxy for spending; use balance as-is for simplicity)
    await supabase.from("peer_stats").upsert({
      age_group: band,
      year,
      month,
      avg_behavior_score: Math.round(avg(b.scores) * 100) / 100,
      avg_savings_rate: Math.round(avg(b.savingsBalances) * 100) / 100,
      avg_interest_rate: Math.round(avg(b.rates) * 100) / 100,
      sample_count: b.count,
    }, { onConflict: "age_group,year,month" });
  }

  return new Response(JSON.stringify({ ok: true, year, month, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
