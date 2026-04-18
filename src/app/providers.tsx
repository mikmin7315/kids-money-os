"use client";

import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  // Keep this wrapper so query state, theme, or browser-side auth listeners can be added later.
  return <>{children}</>;
}
