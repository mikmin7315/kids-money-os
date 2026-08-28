import { notFound, redirect } from "next/navigation";
import { getChildModeContext, requireAppConsent } from "@/lib/auth";
import { getAppDataBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ChildGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAppConsent();
  const [childMode, bundle] = await Promise.all([getChildModeContext(), getAppDataBundle()]);

  const isParentOrAdmin = auth.user && (auth.profile?.role === "parent" || auth.profile?.role === "admin");
  const isChildMode = childMode.childId === id;
  if (!isParentOrAdmin && !isChildMode) redirect("/login");

  const child = bundle.children.find((c) => c.id === id);
  if (!child) notFound();

  return (
    <div style={{ background: "#E0F2FE", minHeight: "100dvh" }}>
      <main className="px-4 pb-36 pt-8">
        {/* 헤더 */}
        <div className="mb-7">
          <p style={{ fontSize: 13, fontWeight: 600, color: "#64B5D9", marginBottom: 4 }}>{child.name}</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0C4B78", letterSpacing: "-0.03em" }}>
            목표 저금통
          </h1>
          <p style={{ fontSize: 13, color: "#64B5D9", marginTop: 4 }}>꿈을 위해 차곡차곡 모아봐요!</p>
        </div>

        {/* 빈 상태 */}
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-[28px] bg-white px-6 py-12 shadow-[0_4px_20px_rgba(14,165,233,0.12)]"
          style={{ minHeight: 260 }}
        >
          <span style={{ fontSize: 56 }}>🎯</span>
          <div className="text-center">
            <p style={{ fontSize: 16, fontWeight: 800, color: "#0C4B78", marginBottom: 8 }}>
              아직 목표가 없어요
            </p>
            <p style={{ fontSize: 13, color: "#64B5D9", lineHeight: 1.6 }}>
              부모님과 함께<br />목표를 만들어 보세요!
            </p>
          </div>
          <div
            className="mt-2 rounded-[16px] px-6 py-3 text-[14px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #0EA5E9, #38BDF8)" }}
          >
            곧 출시 예정 🚀
          </div>
        </div>

        {/* 안내 카드 */}
        <div
          className="mt-4 rounded-[20px] bg-white/70 px-5 py-4"
          style={{ border: "1.5px solid rgba(14,165,233,0.15)" }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: "#0EA5E9", marginBottom: 8 }}>목표 저금통이란?</p>
          <ul className="space-y-2">
            {[
              { emoji: "💰", text: "원하는 것을 목표로 설정해요" },
              { emoji: "📈", text: "조금씩 저금해서 목표를 채워가요" },
              { emoji: "🎁", text: "가족이 함께 응원하고 선물할 수 있어요" },
            ].map(({ emoji, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <span style={{ fontSize: 16 }}>{emoji}</span>
                <span style={{ fontSize: 12, color: "#374151" }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
