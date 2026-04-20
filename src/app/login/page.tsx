import { redirect } from "next/navigation";
import { AuthTabs } from "@/components/auth/auth-forms";
import { getAuthContext } from "@/lib/auth";

export default async function LoginPage() {
  const auth = await getAuthContext();
  if (auth.user) redirect("/");

  return (
    <main className="monari-auth-shell">
      <div className="monari-auth-card">
        {/* Logo */}
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--monari-hero)] mb-5">
          <span className="text-[22px] font-800 text-white">M</span>
        </div>

        <p className="text-[12px] font-700 tracking-[0.16em] uppercase text-[var(--monari-primary)] mb-2">Monari</p>
        <h1 className="text-[28px] font-800 leading-[1.1] tracking-tight text-[var(--monari-ink)] mb-3">
          아이와 함께 하는<br />약속 기반 용돈 앱
        </h1>
        <p className="text-[13px] text-[var(--monari-ink-soft)] mb-5">
          부모 계정으로 시작하면, 약속·용돈·이자를 한 흐름으로 연결할 수 있어요.
        </p>

        <div className="space-y-2 mb-6">
          {[
            "아이와 함께 약속을 만들고 지켜요",
            "용돈이 행동과 이자로 연결돼요",
            "이유를 설명할 수 있는 금융 흐름",
          ].map((text) => (
            <div key={text} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--monari-primary)] shrink-0" />
              <p className="text-[13px] text-[var(--monari-ink-soft)]">{text}</p>
            </div>
          ))}
        </div>

        <AuthTabs />
      </div>
    </main>
  );
}
