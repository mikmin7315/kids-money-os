import Link from "next/link";
import { MobileShell, PageContainer } from "@/components/ui/primitives";
import { getAuthContext } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RestrictedPage() {
  const auth = await getAuthContext();
  const supabase = await getSupabaseServerClient();

  let restriction = null;
  if (auth.user) {
    const { data } = await supabase
      .from("account_restrictions")
      .select("type, reason, ends_at")
      .eq("user_id", auth.user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    restriction = data;
  }

  const TYPE_DESC: Record<string, string> = {
    full: "계정 접근이 전면 차단됐어요.",
    read_only: "조회만 가능하며 모든 거래가 제한돼요.",
    suspend: "계정이 일시 정지됐어요.",
  };

  return (
    <PageContainer>
      <MobileShell>
        <div className="flex flex-col items-center py-16 text-center">
          <p style={{ fontSize: 64, marginBottom: 16 }}>🔒</p>
          <p className="text-lg font-extrabold text-[var(--color-text)]">계정 이용이 제한됐어요</p>
          {restriction ? (
            <>
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                {TYPE_DESC[restriction.type] ?? "이용이 제한됐습니다."}
              </p>
              {restriction.reason && (
                <div className="mt-3 rounded-[12px] bg-[#f9fafb] px-5 py-3">
                  <p className="text-xs font-semibold text-[var(--color-muted)]">사유</p>
                  <p className="mt-1 text-sm text-[var(--color-text)]">{restriction.reason}</p>
                </div>
              )}
              {restriction.ends_at && (
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  제한 해제 예정: {String(restriction.ends_at).slice(0, 10)}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted)]">운영팀에 문의해주세요.</p>
          )}
          <div className="mt-8 flex gap-3">
            <Link
              href="/inquiries"
              className="rounded-[14px] bg-[var(--color-accent)] px-6 py-3 text-sm font-bold text-white"
            >
              해제 요청 문의
            </Link>
            <Link
              href="/"
              className="rounded-[14px] border border-[var(--color-border)] px-6 py-3 text-sm font-bold"
            >
              홈으로
            </Link>
          </div>
        </div>
      </MobileShell>
    </PageContainer>
  );
}
