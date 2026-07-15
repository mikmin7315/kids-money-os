import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { ForceLogoutButton } from "@/components/admin/force-logout-button";
import { requireAdminSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  email: string;
  role: string;
  last_sign_in_at: string | null;
  created_at: string;
  banned_until: string | null;
};

async function loadSessions(): Promise<{ rows: SessionRow[]; error?: string }> {
  try {
    const admin = getSupabaseAdminClient();
    const { data: usersData, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) throw error;

    const userIds = usersData.users.map((u) => u.id);
    const { data: profiles } = await admin.from("profiles").select("id, role").in("id", userIds);
    const roleMap = new Map((profiles ?? []).map((p) => [String(p.id), String(p.role)]));

    const rows: SessionRow[] = usersData.users.map((u) => ({
      id: u.id,
      email: u.email ?? "(이메일 없음)",
      role: roleMap.get(u.id) ?? "parent",
      last_sign_in_at: u.last_sign_in_at ?? null,
      created_at: u.created_at,
      banned_until: (u as unknown as { banned_until?: string | null }).banned_until ?? null,
    }));

    rows.sort((a, b) => {
      const ta = a.last_sign_in_at ?? a.created_at;
      const tb = b.last_sign_in_at ?? b.created_at;
      return tb.localeCompare(ta);
    });

    return { rows };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "세션 조회 실패" };
  }
}

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-[#ede9fe] text-[#5b21b6]",
  parent: "bg-[#f3f4f6] text-[#374151]",
};

export default async function AdminSessionsPage() {
  await requireAdminSession();
  const { rows, error } = await loadSessions();

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="Admin · 보안" title="세션 관리 (A-S-01)" />

        <div className="mb-4 rounded-[12px] bg-[#fef3c7] px-4 py-3">
          <p className="text-xs font-semibold text-[#92400e]">
            Supabase Auth 제약: 특정 기기 세션 목록은 조회 불가합니다. 강제 로그아웃은 해당 사용자의 모든 세션을 종료합니다.
          </p>
        </div>

        {error && <div className="mb-4 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-[12px] bg-[#f9fafb] p-3 text-center">
            <p className="text-[10px] font-semibold text-[var(--color-muted)]">전체 사용자</p>
            <p className="mt-1 text-lg font-black text-[var(--color-text)]">{rows.length}</p>
          </div>
          <div className="rounded-[12px] bg-[#f9fafb] p-3 text-center">
            <p className="text-[10px] font-semibold text-[var(--color-muted)]">어드민</p>
            <p className="mt-1 text-lg font-black text-[#5b21b6]">{rows.filter((r) => r.role === "admin").length}</p>
          </div>
        </div>

        <section className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-[14px] border border-[var(--color-border)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-[var(--color-text)]">{row.email}</p>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${ROLE_STYLE[row.role] ?? ROLE_STYLE.parent}`}>
                      {row.role}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                    최근 로그인: {row.last_sign_in_at ? row.last_sign_in_at.slice(0, 16).replace("T", " ") : "기록 없음"}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted)]">
                    가입: {row.created_at.slice(0, 10)}
                    {row.banned_until && <span className="ml-2 font-bold text-[#dc2626]">이용 정지 중</span>}
                  </p>
                </div>
                <ForceLogoutButton userId={row.id} />
              </div>
            </div>
          ))}
          {rows.length === 0 && !error && (
            <p className="text-sm text-[var(--color-muted)]">사용자가 없습니다.</p>
          )}
        </section>
      </MobileShell>
    </PageContainer>
  );
}
