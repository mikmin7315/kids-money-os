"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ChildError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const childId = params?.id as string | undefined;

  return (
    <div data-theme="child-violet" style={{ background: "#F5F0FF", minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ maxWidth: 320, width: "100%", textAlign: "center" }}>
        <p style={{ fontSize: 64, marginBottom: 16 }}>😢</p>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#052E16", margin: "0 0 8px" }}>
          앗, 뭔가 잘못됐어요
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#6b7280", margin: "0 0 28px" }}>
          잠깐 쉬었다가 다시 해볼까요?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={reset}
            style={{
              background: "linear-gradient(135deg,#3B0764,#6C3FE8)",
              color: "#fff",
              border: "none",
              borderRadius: 18,
              padding: "14px 0",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
            }}
          >
            <RefreshCw size={18} />
            다시 시도하기
          </button>
          {childId && (
            <Link
              href={`/child/${childId}`}
              style={{
                background: "rgba(108,63,232,0.1)",
                color: "#6C3FE8",
                borderRadius: 18,
                padding: "14px 0",
                fontSize: 15,
                fontWeight: 800,
                textDecoration: "none",
                display: "block",
                textAlign: "center",
              }}
            >
              홈으로 가기
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
