import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { requireParentSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  service: "이용약관", privacy: "개인정보처리방침", marketing: "마케팅 수신 동의",
};

export default async function ConsentHistoryPage() {
  const auth = await requireParentSession();
  const supabase = await getSupabaseServerClient();

  const { data } = await supabase
    .from("consent_logs")
    .select("id, terms_type, version, accepted_at")
    .eq("user_id", auth.user!.id)
    .order("accepted_at", { ascending: false });

  const logs = data ?? [];

  return (
    <PageContainer>
      <MobileShell>
        <AppHeader eyebrow="설정" title="동의 이력" />

        {logs.length === 0 ? (
          <div className="rounded-[16px] bg-[var(--monari-surface-soft)] py-10 text-center text-sm text-[var(--color-muted)]">
            동의 이력이 없어요.
          </div>
        ) : (
          <div className="rounded-[16px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-[var(--color-border)]">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{TYPE_LABEL[l.terms_type] ?? l.terms_type}</p>
                  <p className="text-[11px] text-[var(--color-muted)]">v{l.version}</p>
                </div>
                <p className="text-[11px] text-[var(--color-muted)]">{String(l.accepted_at ?? "").slice(0, 10)}</p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-[var(--color-muted)]">
          약관 내용은 <Link href="/legal/terms" className="font-bold text-[var(--color-accent)]">이용약관</Link> 및{" "}
          <Link href="/legal/privacy" className="font-bold text-[var(--color-accent)]">개인정보처리방침</Link>에서 확인하세요.
        </p>

        <div className="mt-4">
          <Link href="/settings" className="text-sm font-bold text-[var(--color-accent)]">← 설정으로</Link>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
