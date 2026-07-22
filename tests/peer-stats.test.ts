import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPeerStatsRows,
  getAgeGroup,
  getMondayDate,
  type BehaviorLogRow,
  type ChildRow,
  type TransactionRow,
} from "../supabase/functions/aggregate-peer-stats/aggregate.ts";

test("classifies only supported peer age groups", () => {
  assert.equal(getAgeGroup(7), "7-9");
  assert.equal(getAgeGroup(13), "10-13");
  assert.equal(getAgeGroup(16), "14-16");
  assert.equal(getAgeGroup(6), null);
  assert.equal(getAgeGroup(17), null);
});

test("calculates the KST week's Monday", () => {
  assert.equal(getMondayDate(new Date("2026-07-22T08:00:00.000Z")), "2026-07-20");
  assert.equal(getMondayDate(new Date("2026-07-20T08:00:00.000Z")), "2026-07-20");
});

test("aggregates allowance, savings, behavior, and spend for an anonymous cohort", () => {
  const children: ChildRow[] = Array.from({ length: 10 }, (_, index) => ({
    id: `child-${index}`,
    birth_year: 2015,
  }));
  const transactions: TransactionRow[] = children.flatMap((child) => [
    { child_id: child.id, type: "allowance", amount: 10_000 },
    { child_id: child.id, type: "reward", amount: 2_000 },
    { child_id: child.id, type: "save", amount: 3_000 },
    { child_id: child.id, type: "spend", amount: 1_000 },
  ]);
  const logs: BehaviorLogRow[] = children.flatMap((child) => [
    { child_id: child.id, status: "approved" },
    { child_id: child.id, status: "rejected" },
  ]);

  const rows = buildPeerStatsRows(children, transactions, logs, 2026, "2026-07-20");

  assert.deepEqual(rows, [{
    week_start: "2026-07-20",
    age_group: "10-13",
    region: null,
    avg_allowance: 12_000,
    avg_savings_rate: 25,
    avg_behavior_rate: 50,
    spend_breakdown: [{ label: "기타", pct: 100 }],
    sample_size: 10,
  }]);
});

test("does not emit cohorts below the privacy threshold", () => {
  const children: ChildRow[] = Array.from({ length: 9 }, (_, index) => ({
    id: `child-${index}`,
    birth_year: 2015,
  }));
  assert.deepEqual(buildPeerStatsRows(children, [], [], 2026, "2026-07-20"), []);
});
