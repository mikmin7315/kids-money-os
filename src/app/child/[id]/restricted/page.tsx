import Link from "next/link";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { getChildModeContext } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChildRestrictedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getChildModeContext();
  const supabase = await getSupabaseServerClient();

  const { data: restriction } = await supabase
    .from("account_restrictions")
    .select("type, reason, ends_at")
    .eq("child_id", ctx.childId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div data-theme="child-violet" style={{ background: "#E0F2FE", minHeight: "100dvh" }}>
    <PageContainer>
      <MobileShell>
        <div className="flex flex-col items-center py-16 text-center">
          <p style={{ fontSize: 64, marginBottom: 16 }}>🔒</p>
          <p className="text-lg font-extrabold text-[var(--color-text)]">지금은 사용할 수 없어요</p>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            부모님이 일시적으로 사용을 막아두셨어요.
          </p>
          {restriction?.ends_at && (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              {String(restriction.ends_at).slice(0, 10)}까지 제한돼요
            </p>
          )}
          <div className="mt-8 rounded-[16px] bg-[var(--monari-hero-lo)] px-6 py-5">
            <p className="text-sm font-bold text-[var(--monari-hero)]">부모님께 물어보세요</p>
            <p className="mt-1 text-xs text-[var(--monari-hero)]">왜 막혀있는지 부모님께 여쭤봐요!</p>
          </div>
          <Link
            href={`/child/${id}`}
            className="mt-6 rounded-[14px] border border-[var(--color-border)] px-6 py-3 text-sm font-bold"
          >
            홈으로
          </Link>
        </div>
      </MobileShell>
    </PageContainer>
    </div>
  );
}
