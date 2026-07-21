"use client";

import { usePathname } from "next/navigation";

const STEPS = [
  { path: "/setup/1", label: "부모 확인" },
  { path: "/setup/2", label: "아이 추가" },
  { path: "/setup/3", label: "용돈 설정" },
  { path: "/setup/4", label: "이자율" },
  { path: "/setup/5", label: "행동 약속" },
];

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => s.path === pathname);
  const isComplete = pathname === "/setup/complete";
  const progress = isComplete ? 100 : currentIndex >= 0 ? ((currentIndex + 1) / STEPS.length) * 100 : 0;

  return (
    <div data-theme="light" style={{ minHeight: "100dvh", background: "var(--monari-bg)", display: "flex", flexDirection: "column" }}>
      {/* 상단 프로그레스 */}
      {!isComplete && (
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--monari-hero)" }}>
              {currentIndex >= 0 ? `${currentIndex + 1} / ${STEPS.length}` : ""}
            </span>
            <span style={{ fontSize: 12, color: "var(--monari-ink-muted)" }}>
              {currentIndex >= 0 ? STEPS[currentIndex].label : ""}
            </span>
          </div>
          <div style={{ height: 6, background: "#F0F0F5", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--monari-hero)",
                borderRadius: 99,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}
