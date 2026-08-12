import Link from "next/link";
import { requireParentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Setup1Page() {
  const auth = await requireParentSession();

  const displayName = auth.profile?.name || auth.user?.email?.split("@")[0] || "부모님";

  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-8">
      <div className="mb-10 text-center">
        <div style={{ fontSize: 64, marginBottom: 16 }}>👋</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--monari-ink)", letterSpacing: "-0.03em", marginBottom: 8 }}>
          환영합니다!
        </h1>
        <p style={{ fontSize: 15, color: "var(--monari-ink-muted)", lineHeight: 1.6 }}>
          모나리와 함께 우리 아이의<br />첫 번째 금융 습관을 시작해요.
        </p>
      </div>

      <div
        style={{
          background: "var(--monari-surface)",
          borderRadius: 20,
          padding: "20px 20px",
          marginBottom: 32,
          border: "1px solid var(--monari-line)",
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--monari-ink-muted)", marginBottom: 4 }}>로그인 계정</p>
        <p style={{ fontSize: 17, fontWeight: 800, color: "var(--monari-ink)" }}>{displayName}</p>
        <p style={{ fontSize: 13, color: "var(--monari-ink-muted)" }}>{auth.user?.email}</p>
      </div>

      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--monari-ink)", marginBottom: 12 }}>설정할 항목</p>
        {[
          { emoji: "👶", label: "아이 프로필 추가" },
          { emoji: "💰", label: "정기 용돈 설정" },
          { emoji: "📈", label: "이자율 설정" },
          { emoji: "✅", label: "행동 약속 설정" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 22 }}>{item.emoji}</span>
            <span style={{ fontSize: 14, color: "var(--monari-ink)" }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto" }}>
        <Link
          href="/setup/2"
          style={{
            display: "block",
            textAlign: "center",
            background: "var(--monari-hero)",
            color: "#fff",
            borderRadius: 16,
            padding: "16px",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          시작하기 →
        </Link>
        <Link
          href="/"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 12,
            fontSize: 13,
            color: "var(--monari-ink-muted)",
            textDecoration: "none",
          }}
        >
          나중에 설정할게요
        </Link>
      </div>
    </main>
  );
}
