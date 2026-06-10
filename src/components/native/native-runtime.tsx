"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { StatusBar, Style } from "@capacitor/status-bar";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function NativeRuntime() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === "android") {
      void StatusBar.setBackgroundColor({ color: "#25273a" });
    }

    const handleAuthCallback = async (url: string) => {
      const expectedCallback = process.env.NEXT_PUBLIC_NATIVE_AUTH_REDIRECT_URL ?? "com.monari.family://auth/callback";
      if (!url.startsWith(expectedCallback)) return;
      if (window.sessionStorage.getItem("monari:last-auth-callback") === url) return;
      window.sessionStorage.setItem("monari:last-auth-callback", url);

      try {
        const callbackUrl = new URL(url);
        const code = callbackUrl.searchParams.get("code");
        const oauthError = callbackUrl.searchParams.get("error_description") ?? callbackUrl.searchParams.get("error");

        await Browser.close().catch(() => undefined);

        if (!code || oauthError) {
          window.location.replace(`/login?authError=${encodeURIComponent(oauthError ?? "Google 로그인에 실패했습니다.")}`);
          return;
        }

        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.location.replace(error ? `/login?authError=${encodeURIComponent(error.message)}` : "/");
      } catch {
        window.location.replace("/login?authError=native_oauth_callback");
      }
    };

    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) window.history.back();
    });
    const authListener = App.addListener("appUrlOpen", ({ url }) => {
      void handleAuthCallback(url);
    });
    void App.getLaunchUrl().then((launch) => {
      if (launch?.url) void handleAuthCallback(launch.url);
    });

    return () => {
      void listener.then((handle) => handle.remove());
      void authListener.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
