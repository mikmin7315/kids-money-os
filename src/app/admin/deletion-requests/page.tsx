import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { DeletionProcessForm } from "@/components/admin/deletion-process-form";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-[#fef3c7] text-[#92400e]",
  processing: "bg-[#dbeafe] text-[#1e40af]",
  completed: "bg-[#d1fae5] text-[#065f46]",
  rejected: "bg-[#fee2e2] text-[#991b1b]",
};

export default async function AdminDeletionRequestsPage() {
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  const { data } = await admin
    .from("account_deletion_requests")
    .select("id, status, reason, scheduled_for, created_at, completed_at, profiles!account_deletion_requests_user_id_fkey(email)")
    .order("created_at", { ascending: false });

  const requests = (data ?? []).map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return { ...r, email: String(profile?.email ?? "-") };
  });

  const pending = requests.filter((r) => r.status === "pending");

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 탈퇴" title="탈퇴/삭제 요청 관리" />

        {pending.length > 0 && (
          <div className="mb-4 rounded-[16px] bg-[#fee2e2] px-4 py-3">
            <p className="text-sm font-bold text-[#991b1b]">처리 대기 {pending.length}건</p>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="rounded-[16px] bg-[#f9fafb] py-10 text-center text-sm text-[var(--color-muted)]">탈퇴 요청이 없어요.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{r.email}</p>
                    {r.reason && <p className="text-[11px] text-[var(--color-muted)]">{r.reason}</p>}
                    <p className="text-[11px] text-[var(--color-muted)]">
                      삭제 예정: {String(r.scheduled_for ?? "").slice(0, 10)} · 요청: {String(r.created_at ?? "").slice(0, 10)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_COLOR[r.status] ?? ""}`}>
                    {r.status}
                  </span>
                </div>
                {r.status === "pending" && <DeletionProcessForm requestId={r.id} />}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">← 대시보드로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
