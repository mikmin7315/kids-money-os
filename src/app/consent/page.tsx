import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { ConsentForm } from "@/components/auth/consent-form";
import { getAuthContext } from "@/lib/auth";
import { hasCurrentConsent } from "@/lib/consent";

export const dynamic = "force-dynamic";

export default async function ConsentPage() {
  const auth = await getAuthContext();
  if (!auth.user) redirect("/login");
  if (auth.profile?.role === "admin" || hasCurrentConsent(auth.profile)) redirect("/");

  return (
    <main className="monari-auth-shell">
      <div className="w-full space-y-5">
        <header className="monari-card p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--monari-plus-bg)] text-[var(--monari-hero)]">
            <ShieldCheck size={22} aria-hidden="true" />
          </span>
          <p className="mt-5 text-xs font-extrabold tracking-[0.14em] text-[var(--monari-primary)]">PARENT CONSENT</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--monari-ink)]">가족 금융교육을 시작하기 전에 확인해주세요</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--monari-ink-soft)]">
            부모님과 아이의 정보를 책임 있게 관리하기 위해 필수 동의 내용을 확인합니다.
          </p>
        </header>
        <section className="monari-card p-5">
          <ConsentForm />
        </section>
      </div>
    </main>
  );
}
