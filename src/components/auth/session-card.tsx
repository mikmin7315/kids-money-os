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
      <p className="text-lg font-semibold">Signed in account</p>
      <div className="mt-4 space-y-2 text-sm text-[var(--color-muted)]">
        <p>Name: {name ?? "Unknown"}</p>
        <p>Email: {email ?? "Unknown"}</p>
        <p>Role: {role ?? "parent"}</p>
      </div>
      <form action={signOut} className="mt-4">
        <button
          type="submit"
          className="w-full rounded-full bg-[var(--color-text)] px-4 py-3 text-sm font-semibold text-[var(--color-bg)]"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
