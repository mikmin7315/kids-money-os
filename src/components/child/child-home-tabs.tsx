"use client";

import { useState, type ReactNode } from "react";

type Tab = "현황" | "기록" | "미리쓰기";

export function ChildHomeTabs({
  statContent,
  recordContent,
  borrowContent,
}: {
  statContent: ReactNode;
  recordContent: ReactNode;
  borrowContent: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("현황");

  return (
    <div>
      <div className="flex gap-1.5 mb-5 px-1">
        {(["현황", "기록", "미리쓰기"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 rounded-[12px] py-2 text-[13px] font-bold transition"
            style={{
              background: tab === t ? "#6C3FE8" : "rgba(108,63,232,0.10)",
              color: tab === t ? "#fff" : "#6C3FE8",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "현황" && statContent}
      {tab === "기록" && recordContent}
      {tab === "미리쓰기" && borrowContent}
    </div>
  );
}
