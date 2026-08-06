"use client";

import { ReactNode } from "react";
import { AppLockProvider } from "@/components/auth/app-lock-provider";

export default function Providers({ children }: { children: ReactNode }) {
  return <AppLockProvider>{children}</AppLockProvider>;
}
