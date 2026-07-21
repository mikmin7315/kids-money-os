"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Suspense } from "react";

const STEPS = [
  { path: "/setup/1", label: "부모 확인" },
  { path: "/setup/2", label: "아이 추가" },
  { path: "/setup/3", label: "용돈 설정" },
  { path: "/setup/4", label: "이자율" },
  { path: "/setup/5", label: "행동 약속" },
];

function SetupHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentIndex = STEPS.findIndex((s) => s.path === pathname);
  const isComplete = pathname === "/setup/complete";
  const progress = isComplete ? 100 : currentIndex >= 0 ? ((currentIndex + 1) / STEPS.length) * 100 : 0;

  const childIds = searchParams.get("childIds") || "";
  const childNames = searchParams.get("childNames") || "";
  const childIndex = Number(searchParams.get("childIndex") || "0");

  const hasPrevChild = childIndex > 0 && ["/setup/3", "/setup/4"].includes(pathname);
  const prevStepPath = currentIndex > 0 ? STEPS[currentIndex - 1].path : null;
  const sharedParams = childIds
    ? `?childIds=${childIds}&childNames=${childNames}&childIndex=${Math.max(0, childIndex - 1)}`
    : "";

  const prevPath = hasPrevChild
    ? `${pathname}?childIds=${childIds}&childNames=${childNames}&childIndex=${childIndex - 1}`
    : prevStepPath
    ? `${prevStepPath}${sharedParams}`
    : null;

  if (isComplete) return null;

  return (
    <div style={{ padding: "12px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        {prevPath ? (
          <button
            onClick={() => router.push(prevPath)}
            style={{
              display: "flex", alignItems: "center", gap: 2,
              background: "none", border: "none", padding: "4px 0",
              cursor: "pointer", color: "var(--monari-ink-muted)",
              fontSize: 13, fontWeight: 600, marginRight: "auto",
            }}
          >
            <ChevronLeft size={18} /> 이전
          </button>
        ) : (
          <div style={{ marginRight: "auto" }} />
        )}
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--monari-hero)" }}>
          {currentIndex >= 0 ? `${currentIndex + 1} / ${STEPS.length}` : ""}
        </span>
        <span style={{ fontSize: 12, color: "var(--monari-ink-muted)", marginLeft: 8 }}>
          {currentIndex >= 0 ? STEPS[currentIndex].label : ""}
        </span>
      </div>
      <div style={{ height: 6, background: "#F0F0F5", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: "var(--monari-hero)", borderRadius: 99,
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" style={{ minHeight: "100dvh", background: "var(--monari-bg)", display: "flex", flexDirection: "column" }}>
      <Suspense fallback={<div style={{ height: 52 }} />}>
        <SetupHeader />
      </Suspense>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}
