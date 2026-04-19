import { signOut } from "@/actions/auth";

export function SessionCard({
  email,
  name,
  role,
}: {
  email?: string | null;
  name?: string | null;
  role?: string | null;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(249,243,234,0.95))] p-5 shadow-[var(--shadow-soft)]">
      <p className="font-display text-xl font-semibold">로그인된 계정</p>
      <div className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
        <p>이름: {name ?? "알 수 없음"}</p>
        <p>이메일: {email ?? "알 수 없음"}</p>
        <p>역할: {role ?? "parent"}</p>
      </div>
      <form action={signOut} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-full bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:opacity-92"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
