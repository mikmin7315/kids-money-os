import { redirect } from "next/navigation";
import { AuthTabs } from "@/components/auth/auth-forms";
import { getAuthContext } from "@/lib/auth";

export default async function LoginPage() {
  const auth = await getAuthContext();
  if (auth.user) redirect("/");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 py-12">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)]">
            <span className="text-2xl font-black text-white">M</span>
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Monari</h1>
          <p className="text-sm text-[var(--color-muted)]">어린이 금융교육 앱</p>
        </div>

        <AuthTabs />
      </div>
    </main>
  );
}
