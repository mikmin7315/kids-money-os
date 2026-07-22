export const minimumPeerSampleSize = 10;

export type AgeGroup = "7-9" | "10-13" | "14-16";
export type ChildRow = { id: string; birth_year: number };
export type TransactionRow = {
  child_id: string;
  type: "allowance" | "reward" | "save" | "spend";
  amount: number;
};
export type BehaviorLogRow = {
  child_id: string;
  status: "pending" | "completed" | "approved" | "rejected";
};
export type PeerStatsInsert = {
  week_start: string;
  age_group: AgeGroup;
  region: null;
  avg_allowance: number;
  avg_savings_rate: number;
  avg_behavior_rate: number;
  spend_breakdown: Array<{ label: string; pct: number }>;
  sample_size: number;
};

export function buildPeerStatsRows(
  children: ChildRow[],
  transactions: TransactionRow[],
  behaviorLogs: BehaviorLogRow[],
  currentYear: number,
  weekStart: string,
  minimumSampleSize = minimumPeerSampleSize,
): PeerStatsInsert[] {
  const groups = new Map<AgeGroup, ChildRow[]>();
  const transactionsByChild = groupByChild(transactions);
  const logsByChild = groupByChild(behaviorLogs);

  for (const child of children) {
    const ageGroup = getAgeGroup(currentYear - Number(child.birth_year));
    if (!ageGroup) continue;
    const groupChildren = groups.get(ageGroup) ?? [];
    groupChildren.push(child);
    groups.set(ageGroup, groupChildren);
  }

  return [...groups.entries()].flatMap(([ageGroup, groupChildren]) => {
    if (groupChildren.length < minimumSampleSize) return [];

    const allowanceTotals: number[] = [];
    const savingsRates: number[] = [];
    let approvedLogCount = 0;
    let totalLogCount = 0;
    let totalSpend = 0;

    for (const child of groupChildren) {
      const childTransactions = transactionsByChild.get(child.id) ?? [];
      const allowance = childTransactions
        .filter((transaction) => transaction.type === "allowance" || transaction.type === "reward")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      const savings = childTransactions
        .filter((transaction) => transaction.type === "save")
        .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);
      totalSpend += childTransactions
        .filter((transaction) => transaction.type === "spend")
        .reduce((sum, transaction) => sum + Math.abs(Number(transaction.amount)), 0);
      allowanceTotals.push(allowance);
      savingsRates.push(allowance > 0 ? Math.min((savings / allowance) * 100, 100) : 0);

      const childLogs = logsByChild.get(child.id) ?? [];
      totalLogCount += childLogs.length;
      approvedLogCount += childLogs.filter(
        (log) => log.status === "approved" || log.status === "completed",
      ).length;
    }

    return [{
      week_start: weekStart,
      age_group: ageGroup,
      region: null,
      avg_allowance: Math.round(average(allowanceTotals)),
      avg_savings_rate: roundToTwo(average(savingsRates)),
      avg_behavior_rate: roundToTwo(
        totalLogCount > 0 ? (approvedLogCount / totalLogCount) * 100 : 0,
      ),
      spend_breakdown: totalSpend > 0 ? [{ label: "기타", pct: 100 }] : [],
      sample_size: groupChildren.length,
    }];
  });
}

export function getAgeGroup(age: number): AgeGroup | null {
  if (age >= 7 && age <= 9) return "7-9";
  if (age >= 10 && age <= 13) return "10-13";
  if (age >= 14 && age <= 16) return "14-16";
  return null;
}

export function getMondayDate(nowKst: Date): string {
  const monday = new Date(nowKst);
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  return monday.toISOString().slice(0, 10);
}

function groupByChild<T extends { child_id: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const childRows = grouped.get(row.child_id) ?? [];
    childRows.push(row);
    grouped.set(row.child_id, childRows);
  }
  return grouped;
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
