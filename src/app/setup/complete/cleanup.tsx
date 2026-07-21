"use client";

import { useEffect } from "react";

export function SetupCleanup() {
  useEffect(() => {
    sessionStorage.removeItem("setup2_children");
  }, []);
  return null;
}
