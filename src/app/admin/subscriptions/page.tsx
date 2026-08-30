import Link from "next/link";
import { ArrowLeft, Crown, AlertTriangle } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer, Section, Surface, Badge } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { formatWon } from "@/lib/format";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SubscriberRow = {
  id: string;
  email: string;
  name: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  subscription_cancelled_at: string | null;
  billing_key: string | null;
};

type PaymentRow = {
  id: string;
  parent_id: string;
  payment_id: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  created_at: string;
  parentEmail?: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default async function AdminSubscriptionsPage() {
  await requireAdminSession();

  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [activeSubsRes, cancelledSubsRes, recentPaymentsRes, failedNotifRes, parentEmailsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, name, subscription_tier, subscription_expires_at, subscription_cancelled_at, billing_key")
      .eq("subscription_tier", "plus")
      .gt("subscription_expires_at", now)
      .order("subscription_expires_at", { ascending: true }),
    admin
      .from("profiles")
      .select("id, email, name, subscription_tier, subscription_expires_at, subscription_cancelled_at, billing_key")
      .eq("subscription_tier", "plus")
      .lte("subscription_expires_at", now)
      .order("subscription_expires_at", { ascending: false })
      .limit(10),
    admin
      .from("payment_records")
      .select("id, parent_id, payment_id, amount, status, period_start, period_end, created_at")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("notifications")
      .select("id, parent_id, created_at, body")
      .eq("type", "subscription_renewal_failed")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("profiles").select("id, email"),
  ]);

  const emailMap = new Map(
    (parentEmailsRes.data ?? []).map((p) => [String(p.id), String(p.email ?? "")]),
  );

  const activeSubscribers = (activeSubsRes.data ?? []) as SubscriberRow[];
  const expiredSubscribers = (cancelledSubsRes.data ?? []) as SubscriberRow[];
  const recentPayments: PaymentRow[] = (recentPaymentsRes.data ?? []).map((r) => ({
    ...r,
    id: String(r.id),
    parent_id: String(r.parent_id),
    payment_id: String(r.payment_id),
    amount: Number(r.amount),
    period_start: String(r.period_start),
    period_end: String(r.period_end),
    created_at: String(r.created_at),
    parentEmail: emailMap.get(String(r.parent_id)),
  }));

  const failedNotifs = (failedNotifRes.data ?? []).map((n) => ({
    ...n,
    id: String(n.id),
    parent_id: String(n.parent_id),
    created_at: String(n.created_at),
    body: String(n.body ?? ""),
    parentEmail: emailMap.get(String(n.parent_id)),
  }));

  return (
    <PageContainer>
      <MobileShell>
        <div className="mb-4">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--color-muted)]">
            <ArrowLeft size={14} /> 대시보드
          </Link>
        </div>
        <AppHeader eyebrow="Admin" title="구독 관리" />

        {/* 요약 */}
        <section className="mt-4 mb-6">
          <Surface className="bg-[var(--monari-hero-lo)]">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[16px] bg-white/70 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft)]">활성</p>
                <p className="mt-1 text-[22px] font-black text-[var(--monari-hero)]">{activeSubscribers.length}</p>
              </div>
              <div className="rounded-[16px] bg-white/70 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft)]">만료/해지</p>
                <p className="mt-1 text-[22px] font-black text-[var(--color-text)]">{expiredSubscribers.length}</p>
              </div>
              <div className="rounded-[16px] bg-white/70 p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft)]">갱신 실패</p>
                <p className={`mt-1 text-[22px] font-black ${failedNotifs.length > 0 ? "text-[var(--status-danger-solid)]" : "text-[var(--color-text)]"}`}>{failedNotifs.length}</p>
              </div>
            </div>
          </Surface>
        </section>

        {/* 갱신 실패 알림 */}
        {failedNotifs.length > 0 && (
          <Section title="갱신 실패 (최근 30일)" description="자동 갱신에 실패한 건입니다.">
            <Surface>
              <div className="space-y-3">
                {failedNotifs.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[var(--color-text)] truncate">{n.parentEmail ?? n.parent_id}</p>
                      <p className="text-[11px] text-[var(--color-muted)]">{n.body}</p>
                      <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{formatDate(n.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          </Section>
        )}

        {/* 활성 구독자 */}
        <Section title={`활성 구독자 (${activeSubscribers.length}명)`} description="현재 플러스 플랜을 이용 중인 사용자입니다.">
          <Surface>
            {activeSubscribers.length === 0 ? (
              <p className="rounded-2xl bg-white/65 px-4 py-5 text-center text-sm text-[var(--color-muted)]">활성 구독자가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {activeSubscribers.map((s) => {
                  const isCancelled = !!s.subscription_cancelled_at;
                  const expiresAt = s.subscription_expires_at ? new Date(s.subscription_expires_at) : null;
                  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                  return (
                    <div key={s.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/65 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Crown size={13} className="text-yellow-500 shrink-0" />
                          <p className="text-[13px] font-bold text-[var(--color-text)] truncate">{s.email}</p>
                        </div>
                        {s.name && <p className="text-[11px] text-[var(--color-muted)]">{s.name}</p>}
                        {expiresAt && (
                          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                            {isCancelled ? "해지 예정 · " : "갱신일 · "}{formatDate(expiresAt.toISOString())}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isCancelled ? (
                          <Badge tone="amber">해지 예정</Badge>
                        ) : (
                          <Badge tone="emerald">활성</Badge>
                        )}
                        {daysLeft !== null && daysLeft <= 7 && !isCancelled && (
                          <Badge tone="rose">D-{daysLeft}</Badge>
                        )}
                        {!s.billing_key && !isCancelled && (
                          <Badge tone="amber">빌링키 없음</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Surface>
        </Section>

        {/* 최근 결제 내역 */}
        <Section title="최근 결제 내역 (30일)" description="자동 갱신 포함 전체 결제 기록입니다.">
          <Surface>
            {recentPayments.length === 0 ? (
              <p className="rounded-2xl bg-white/65 px-4 py-5 text-center text-sm text-[var(--color-muted)]">결제 내역이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {recentPayments.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/65 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-[var(--color-text)] truncate">{r.parentEmail ?? r.parent_id}</p>
                      <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                        {formatDate(r.period_start)} ~ {formatDate(r.period_end)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[13px] font-black tabular-nums text-[var(--color-text)]">{formatWon(r.amount)}</span>
                      <Badge tone={r.status === "cancelled" ? "rose" : "emerald"}>
                        {r.status === "cancelled" ? "취소" : "완료"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </Section>

        {/* 만료/해지된 구독 */}
        {expiredSubscribers.length > 0 && (
          <Section title="최근 만료/해지 (최대 10건)">
            <Surface>
              <div className="space-y-2">
                {expiredSubscribers.map((s) => (
                  <div key={s.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/65 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-[var(--color-text)] truncate">{s.email}</p>
                      {s.subscription_expires_at && (
                        <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                          만료: {formatDate(s.subscription_expires_at)}
                        </p>
                      )}
                    </div>
                    <Badge tone="neutral">만료</Badge>
                  </div>
                ))}
              </div>
            </Surface>
          </Section>
        )}
      </MobileShell>
    </PageContainer>
  );
}
