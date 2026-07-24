import { NextRequest, NextResponse } from "next/server";
import { requireParentSession } from "@/lib/auth";
import { getDashboardView, getAppDataBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireParentSession();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const childId = searchParams.get("child");

  const [dashboard, bundle] = await Promise.all([getDashboardView(), getAppDataBundle()]);
  const allChildren = dashboard.children;
  const primary = childId
    ? (allChildren.find((c) => c.child.id === childId) ?? allChildren[0])
    : allChildren[0];

  if (!primary) {
    return new NextResponse("No child found", { status: 404 });
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  const monthKey = today.slice(0, 7);
  const childName = String(primary.child.name);
  const report = primary.monthReport;
  const wallet = primary.wallet;

  // 이번 달 행동 로그
  const childLogs = bundle.behaviorLogs.filter(
    (l) => l.childId === primary.child.id && l.date.startsWith(monthKey)
  );

  const rows: string[][] = [
    ["모나리 월간 리포트"],
    ["아이", childName],
    ["월", monthKey],
    [],
    ["항목", "금액 (원)"],
    ["이달 용돈", String(report.totalAllowance)],
    ["이달 지출", String(report.totalSpend)],
    ["이달 저축", String(report.totalSave)],
    ["이달 이자", String(report.totalInterest)],
    ["미리쓰기", String(report.totalBorrowed)],
    [],
    ["현재 잔액", String(wallet.balance)],
    ["현재 이자율", String(wallet.currentInterestRate) + "%"],
    ["행동 약속 달성률", String(Math.round(report.behaviorSuccessRate)) + "%"],
  ];

  if (childLogs.length > 0) {
    rows.push([]);
    rows.push(["행동 약속 기록"]);
    rows.push(["날짜", "약속 이름", "상태", "메모"]);
    for (const log of childLogs) {
      const rule = bundle.behaviorRules.find((r) => r.id === log.behaviorRuleId);
      rows.push([
        log.date,
        rule?.title ?? "-",
        log.status,
        log.memo ?? "",
      ]);
    }
  }

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(",")
    )
    .join("\r\n");

  const filename = `monari-report-${childName}-${monthKey}.csv`;

  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
