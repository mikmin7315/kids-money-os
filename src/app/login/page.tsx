import { redirect } from "next/navigation";
import { AuthTabs } from "@/components/auth/auth-forms";
import { getAuthContext } from "@/lib/auth";

export default async function LoginPage() {
  const auth = await getAuthContext();
  if (auth.user) redirect("/");

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center">
        <div className="relative overflow-hidden rounded-[34px] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,248,236,0.98),rgba(232,244,240,0.92))] px-6 py-8 shadow-[var(--shadow-card)]">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[rgba(15,139,124,0.08)] blur-2xl" />
          <div className="pointer-events-none absolute -left-10 bottom-10 h-32 w-32 rounded-full border border-[rgba(200,122,34,0.14)]" />

          <div className="relative mb-8">
            {/* 브랜드 */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent)]">
              <span className="text-2xl font-black text-white">M</span>
            </div>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Monari
            </p>
            <h1 className="mt-3 font-display text-[1.9rem] font-semibold leading-[1.07] tracking-tight text-[var(--color-text)]">
              아이와 함께 하는<br />약속 기반 용돈 앱
            </h1>
            <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
              부모 계정으로 시작하면, 약속·용돈·이자를 한 흐름으로 연결할 수 있어요.
            </p>

            {/* 서비스 핵심 3가지 */}
            <div className="mt-5 space-y-2">
              {[
                { icon: "🤝", text: "아이와 함께 약속을 만들고 지켜요" },
                { icon: "💰", text: "용돈이 행동과 이자로 연결돼요" },
                { icon: "📋", text: "이유를 설명할 수 있는 금융 흐름" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-base">{item.icon}</span>
                  <p className="text-sm leading-6 text-[var(--color-muted)]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <AuthTabs />
        </div>
      </div>
    </main>
  );
}
