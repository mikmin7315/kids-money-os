"use client";

import { useEffect } from "react";

export function SetupCleanup() {
  useEffect(() => {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("setup")) sessionStorage.removeItem(key);
    }
  }, []);
  return null;
}
