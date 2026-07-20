"use client";

import { RefreshCw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#faf5ff", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ maxWidth: 380, width: "100%", background: "#fff", borderRadius: 24, padding: 32, textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
          <p style={{ fontSize: 56, marginBottom: 16 }}>⚠️</p>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: "#1a1a2e", margin: "0 0 8px" }}>앱을 불러오지 못했어요</h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#6b7280", margin: "0 0 24px" }}>
            예기치 않은 오류가 발생했어요. 다시 시도해주세요.
          </p>
          <button
            onClick={reset}
            style={{ width: "100%", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", border: "none", borderRadius: 16, padding: "14px 0", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <RefreshCw size={18} />
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
