import Link from "next/link";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

type RegionStat = {
  region: string;
  avgAllowance: number;
  sampleSize: number;
};

const REGION_BUBBLES: { name: string; cx: number; cy: number }[] = [
  { name: "강원도",        cx: 214, cy: 82 },
  { name: "경기도",        cx: 140, cy: 110 },
  { name: "서울특별시",    cx: 128, cy: 82 },
  { name: "인천광역시",    cx: 98,  cy: 98 },
  { name: "세종특별자치시",cx: 126, cy: 148 },
  { name: "대전광역시",    cx: 130, cy: 165 },
  { name: "충청북도",      cx: 172, cy: 148 },
  { name: "충청남도",      cx: 100, cy: 158 },
  { name: "경상북도",      cx: 208, cy: 182 },
  { name: "대구광역시",    cx: 196, cy: 214 },
  { name: "울산광역시",    cx: 234, cy: 238 },
  { name: "전라북도",      cx: 98,  cy: 210 },
  { name: "광주광역시",    cx: 86,  cy: 252 },
  { name: "전라남도",      cx: 80,  cy: 275 },
  { name: "경상남도",      cx: 186, cy: 268 },
  { name: "부산광역시",    cx: 224, cy: 278 },
  { name: "제주특별자치도",cx: 128, cy: 355 },
];

function getAllowanceColor(amount: number, min: number, max: number): string {
  if (max === min) return "#6366f1";
  const t = (amount - min) / (max - min);
  const r = Math.round(99 + t * (79 - 99));
  const g = Math.round(102 + t * (70 - 102));
  const b = Math.round(241 + t * (209 - 241));
  return `rgb(${r},${g},${b})`;
}

export default async function RegionalStatsPage() {
  const auth = await requireParentSession();
  const profile = auth.profile as { role?: string } | null;
  if (profile?.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-[15px] font-bold text-gray-500">관리자만 접근 가능합니다.</p>
      </div>
    );
  }

  const supabase = await getSupabaseServerClient();

  // 최신 전국 peer_stats (age_group별 지역 데이터)
  const { data: rows } = await supabase
    .from("peer_stats")
    .select("region, avg_allowance, sample_size, age_group, week_start")
    .not("region", "is", null)
    .order("week_start", { ascending: false })
    .limit(200);

  // 지역별로 가장 최근 데이터, age_group 합산 평균
  const regionMap = new Map<string, { total: number; count: number; samples: number }>();
  const seenWeek = rows && rows.length > 0 ? rows[0].week_start : null;

  for (const row of rows ?? []) {
    if (row.week_start !== seenWeek) continue;
    if (!row.region) continue;
    const existing = regionMap.get(row.region as string) ?? { total: 0, count: 0, samples: 0 };
    regionMap.set(row.region as string, {
      total: existing.total + Number(row.avg_allowance ?? 0),
      count: existing.count + 1,
      samples: existing.samples + Number(row.sample_size ?? 0),
    });
  }

  const regionStats: RegionStat[] = Array.from(regionMap.entries()).map(([region, { total, count, samples }]) => ({
    region,
    avgAllowance: Math.round(total / Math.max(count, 1)),
    sampleSize: samples,
  }));

  const amounts = regionStats.map((r) => r.avgAllowance).filter((v) => v > 0);
  const minAmt = amounts.length > 0 ? Math.min(...amounts) : 0;
  const maxAmt = amounts.length > 0 ? Math.max(...amounts) : 1;

  const statByRegion = new Map(regionStats.map((r) => [r.region, r]));

  // 전국 전체 집계
  const { data: nationRows } = await supabase
    .from("peer_stats")
    .select("avg_allowance, sample_size, age_group, week_start")
    .is("region", null)
    .order("week_start", { ascending: false })
    .limit(10);

  const latestNation = (nationRows ?? []).filter((r) => r.week_start === (nationRows?.[0]?.week_start ?? null));
  const nationAvg = latestNation.length > 0
    ? Math.round(latestNation.reduce((s, r) => s + Number(r.avg_allowance ?? 0), 0) / latestNation.length)
    : 0;
  const nationSamples = latestNation.reduce((s, r) => s + Number(r.sample_size ?? 0), 0);

  return (
    <div className="min-h-screen bg-[var(--monari-bg,#f8fafc)] pb-10">
      <header className="sticky top-0 z-10 border-b border-[var(--monari-line,#e5e7eb)] bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[var(--monari-ink-muted,#64748b)] text-[14px]">← 어드민</Link>
          <span className="text-[var(--monari-line-strong,#cbd5e1)]">|</span>
          <h1 className="text-[17px] font-extrabold text-[var(--monari-ink,#0f172a)]">지역별 용돈 현황</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-6 space-y-6">
        {/* 전국 요약 */}
        <div className="rounded-[20px] overflow-hidden" style={{ background: "linear-gradient(135deg,#4338ca,#6366f1)" }}>
          <div className="px-5 py-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-white/60 mb-1 uppercase tracking-wide">전국 평균 용돈</p>
              <p className="text-[28px] font-black text-white tabular-nums leading-none">
                {nationAvg > 0 ? formatWon(nationAvg) : "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-white/60 mb-1 uppercase tracking-wide">총 표본</p>
              <p className="text-[28px] font-black text-white tabular-nums leading-none">{nationSamples}명</p>
              <p className="text-[11px] text-white/50 mt-1">{regionStats.length}개 지역</p>
            </div>
          </div>
        </div>

        {/* 지도 */}
        <div className="rounded-[20px] bg-white border border-[var(--monari-line,#e5e7eb)] overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <p className="text-[14px] font-extrabold text-[var(--monari-ink,#0f172a)] mb-1">지역별 평균 용돈</p>
            <div className="flex items-center gap-3 text-[11px] text-[var(--monari-ink-muted,#64748b)]">
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: getAllowanceColor(minAmt, minAmt, maxAmt) }} /> 낮음
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: getAllowanceColor(maxAmt, minAmt, maxAmt) }} /> 높음
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded-full bg-[var(--monari-line-strong,#cbd5e1)]" /> 데이터 없음
              </span>
            </div>
          </div>
          <div className="flex justify-center py-2 px-4">
            <svg viewBox="0 0 310 410" width="100%" style={{ maxWidth: 340 }}>
              {/* 반도 배경 실루엣 (단순화) */}
              <path
                d="M95,35 L185,25 L230,50 L260,80 L255,120 L270,155 L260,190 L250,230 L265,265 L250,295 L230,300 L210,290 L190,305 L175,295 L165,315 L150,310 L135,320 L115,305 L90,290 L70,295 L60,270 L55,240 L70,215 L60,195 L55,165 L65,140 L60,110 L70,85 L80,60 Z"
                fill="#f1f5f9"
                stroke="#e2e8f0"
                strokeWidth="1.5"
              />
              {/* 제주 섬 */}
              <ellipse cx="128" cy="358" rx="28" ry="14" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />

              {REGION_BUBBLES.map(({ name, cx, cy }) => {
                const stat = statByRegion.get(name);
                const hasData = stat && stat.avgAllowance > 0;
                const color = hasData ? getAllowanceColor(stat.avgAllowance, minAmt, maxAmt) : "#cbd5e1";
                const isSmall = ["서울특별시","대전광역시","광주광역시","대구광역시","울산광역시","부산광역시","세종특별자치시","인천광역시"].includes(name);
                const r = isSmall ? 11 : 16;
                return (
                  <g key={name}>
                    <circle cx={cx} cy={cy} r={r} fill={color} opacity={hasData ? 0.9 : 0.5} />
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth="1.5" opacity={0.6} />
                    {hasData && (
                      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                        fontSize={isSmall ? 5.5 : 6} fontWeight={800} fill="white" fontFamily="inherit">
                        {Math.round(stat.avgAllowance / 1000)}k
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          {regionStats.length === 0 && (
            <p className="pb-5 text-center text-[13px] text-[var(--monari-ink-muted,#64748b)]">지역 데이터가 아직 없어요. 월말 정산 후 생성됩니다.</p>
          )}
        </div>

        {/* 순위 리스트 */}
        {regionStats.length > 0 && (
          <div className="rounded-[20px] bg-white border border-[var(--monari-line,#e5e7eb)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--monari-line,#e5e7eb)]">
              <p className="text-[14px] font-extrabold text-[var(--monari-ink,#0f172a)]">지역 순위 (평균 용돈)</p>
            </div>
            <div className="divide-y divide-[var(--monari-line,#e5e7eb)]">
              {[...regionStats]
                .sort((a, b) => b.avgAllowance - a.avgAllowance)
                .map((stat, i) => {
                  const color = getAllowanceColor(stat.avgAllowance, minAmt, maxAmt);
                  return (
                    <div key={stat.region} className="flex items-center gap-4 px-5 py-3.5">
                      <span className="text-[13px] font-extrabold tabular-nums text-[var(--monari-ink-muted,#64748b)] w-5">{i + 1}</span>
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                      <span className="flex-1 text-[14px] font-semibold text-[var(--monari-ink,#0f172a)]">{stat.region}</span>
                      <div className="text-right">
                        <span className="text-[15px] font-extrabold tabular-nums text-[var(--monari-ink,#0f172a)]">
                          {formatWon(stat.avgAllowance)}
                        </span>
                        <span className="ml-2 text-[11px] text-[var(--monari-ink-muted,#64748b)]">{stat.sampleSize}명</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-[var(--monari-ink-muted,#64748b)]">
          월말 정산(매월 1일) 시 자동 업데이트 · 5명 이상 지역만 표시
        </p>
      </div>
    </div>
  );
}
