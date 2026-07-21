import Link from "next/link";
import { requireParentSession } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SetupCompletePage() {
  const auth = await requireParentSession();
  if (!auth.user) redirect("/login");

  const bundle = await getAppDataBundle();
  const child = bundle.children[0];

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-8 text-center">
      <div style={{ fontSize: 80, marginBottom: 20 }}>🎉</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", marginBottom: 10 }}>
        준비 완료!
      </h1>
      <p style={{ fontSize: 15, color: "var(--monari-ink-muted)", lineHeight: 1.7, marginBottom: 40 }}>
        {child ? (
          <>
            <strong style={{ color: "var(--monari-ink)" }}>{child.name}</strong> 아이의 금융 생활이<br />
            지금부터 시작돼요.
          </>
        ) : (
          <>모나리 설정이 완료됐어요.<br />아이를 추가하고 시작해보세요.</>
        )}
      </p>

      <div style={{
        background: "var(--monari-surface)",
        border: "1px solid var(--monari-line)",
        borderRadius: 20,
        padding: "20px",
        marginBottom: 32,
        width: "100%",
        maxWidth: 320,
      }}>
        {[
          { done: bundle.children.length > 0, label: "아이 등록" },
          { done: bundle.allowanceRules.length > 0, label: "용돈 설정" },
          { done: bundle.interestPolicies.length > 0, label: "이자율 설정" },
          { done: bundle.behaviorRules.length > 0, label: "행동 약속 설정" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
            <span style={{ fontSize: 16 }}>{item.done ? "✅" : "⬜"}</span>
            <span style={{ fontSize: 14, color: item.done ? "var(--monari-ink)" : "var(--monari-ink-muted)", fontWeight: item.done ? 700 : 400 }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <Link
        href="/"
        style={{
          display: "block",
          width: "100%",
          maxWidth: 320,
          textAlign: "center",
          background: "var(--monari-hero)",
          color: "#fff",
          borderRadius: 16,
          padding: "16px",
          fontSize: 16,
          fontWeight: 800,
          textDecoration: "none",
        }}
      >
        홈으로 가기 →
      </Link>
    </main>
  );
}
