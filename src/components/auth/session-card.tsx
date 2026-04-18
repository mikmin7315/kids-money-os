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
    <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <p className="text-lg font-semibold">로그인된 계정</p>
      <div className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
        <p>이름: {name ?? "알 수 없음"}</p>
        <p>이메일: {email ?? "알 수 없음"}</p>
        <p>역할: {role ?? "parent"}</p>
      </div>
      <form action={signOut} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-full bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)]"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
