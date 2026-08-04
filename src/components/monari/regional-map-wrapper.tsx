"use client";

import nextDynamic from "next/dynamic";

export const RegionalMap = nextDynamic(
  () => import("@/components/monari/regional-map").then((m) => m.RegionalMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 380,
          borderRadius: 20,
          background: "var(--monari-surface-soft)",
        }}
      />
    ),
  }
);
