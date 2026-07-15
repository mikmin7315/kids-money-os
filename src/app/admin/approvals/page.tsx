import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { formatWon } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  await requireAdminSession();
  const admin = getSupabaseAdminClient();

  const [behaviorRes, borrowRes] = await Promise.all([
    admin
      .from("behavior_logs")
      .select("id, child_id, achieved, logged_at, behavior_rules(name)")
      .eq("approved", false)
      .eq("achieved", true)
      .order("logged_at", { ascending: false })
      .limit(50),
    admin
      .from("borrow_requests")
      .select("id, child_id, amount, purpose, installments, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const allChildIds = [
    ...new Set([
      ...(behaviorRes.data ?? []).map((r) => r.child_id),
      ...(borrowRes.data ?? []).map((r) => r.child_id),
    ]),
  ];
  const { data: children } = await admin.from("children").select("id, name").in("id", allChildIds);
  const nameMap = (children ?? []).reduce<Record<string, string>>((acc, c) => { acc[c.id] = String(c.name); return acc; }, {});

  const behaviorLogs = (behaviorRes.data ?? []).map((r) => {
    const rule = Array.isArray(r.behavior_rules) ? r.behavior_rules[0] : r.behavior_rules;
    return { id: r.id, child_name: nameMap[r.child_id] ?? "-", rule_name: rule?.name ?? "-", logged_at: String(r.logged_at ?? "") };
  });

  const borrows = (borrowRes.data ?? []).map((r) => ({
    id: r.id,
    child_name: nameMap[r.child_id] ?? "-",
    amount: Number(r.amount),
    purpose: String(r.purpose ?? ""),
    installments: Number(r.installments),
    created_at: String(r.created_at ?? ""),
  }));

  const totalPending = behaviorLogs.length + borrows.length;

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin �� ����" title="���� ��� ����" />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-[12px] bg-white p-3 text-center shadow-[var(--monari-shadow-sm)]">
            <p className="text-[10px] font-semibold text-[var(--color-muted)]">�ൿ ��� ���</p>
            <p className={`mt-1 text-lg font-black ${behaviorLogs.length > 0 ? "text-[var(--monari-primary-strong)]" : "text-[var(--monari-done)]"}`}>
              {behaviorLogs.length}��
            </p>
          </div>
          <div className="rounded-[12px] bg-white p-3 text-center shadow-[var(--monari-shadow-sm)]">
            <p className="text-[10px] font-semibold text-[var(--color-muted)]">�̸����� ���</p>
            <p className={`mt-1 text-lg font-black ${borrows.length > 0 ? "text-[var(--monari-primary-strong)]" : "text-[var(--monari-done)]"}`}>
              {borrows.length}��
            </p>
          </div>
        </div>

        {totalPending === 0 && (
          <div className="rounded-[16px] bg-[var(--status-success-solid)] px-5 py-10 text-center">
            <p style={{ fontSize: 36, marginBottom: 8 }}>?</p>
            <p className="text-sm font-bold text-[var(--status-success-solid-text)]">��� ���� ó�� �Ϸ�!</p>
            <p className="mt-1 text-xs text-[var(--monari-done)]">��� ���� �׸��� �����.</p>
          </div>
        )}

        {behaviorLogs.length > 0 && (
          <section className="mb-5">
            <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">
              �ൿ ��� ���� ��� <span className="text-[var(--monari-primary-strong)]">({behaviorLogs.length})</span>
            </p>
            <div className="rounded-[16px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden divide-y divide-[var(--color-border)]">
              {behaviorLogs.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{b.rule_name}</p>
                    <p className="text-[11px] text-[var(--color-muted)]">{b.child_name} �� {b.logged_at.slice(0, 10)}</p>
                  </div>
                  <span className="rounded-full bg-[var(--status-pending-solid)] px-2 py-0.5 text-[11px] font-bold text-[var(--status-pending-solid-text)]">���� ���</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              * �ൿ ��� ������ �� �θ� ȭ�� �� <Link href="/approvals" className="font-bold text-[var(--color-accent)]">������</Link>���� ó���˴ϴ�.
            </p>
          </section>
        )}

        {borrows.length > 0 && (
          <section className="mb-5">
            <p className="mb-2 text-sm font-extrabold text-[var(--color-text)]">
              �̸����� ���� ��� <span className="text-[var(--monari-primary-strong)]">({borrows.length})</span>
            </p>
            <div className="rounded-[16px] bg-[var(--monari-surface)] shadow-[var(--monari-shadow-md)] overflow-hidden divide-y divide-[var(--color-border)]">
              {borrows.map((b) => (
                <div key={b.id} className="flex items-start justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{b.purpose || "���� ����"}</p>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {b.child_name} �� {b.installments}ȸ �� {b.created_at.slice(0, 10)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums text-sm font-bold">{formatWon(b.amount)}</p>
                    <span className="text-[11px] font-bold text-[var(--monari-primary-strong)]">���</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              * �̸����� ������ �� �θ� ȭ�� �� <Link href="/approvals" className="font-bold text-[var(--color-accent)]">������</Link>���� ó���˴ϴ�.
            </p>
          </section>
        )}

        <div className="mt-4">
          <Link
            href="/approvals"
            className="block w-full rounded-[14px] border border-[var(--color-accent)] py-3 text-center text-sm font-bold text-[var(--color-accent)] transition active:scale-[0.97]"
          >
            �θ� ���������� �̵� ��
          </Link>
        </div>

        <div className="mt-4">
          <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)]">�� ��ú����</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
