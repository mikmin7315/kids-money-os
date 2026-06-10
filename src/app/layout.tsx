import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import { NativeRuntime } from "@/components/native/native-runtime";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

export const metadata: Metadata = {
  title: {
    default: "Monari | 어린이 금융교육",
    template: "%s | Monari",
  },
  description: "행동이 이자를 만들고, 저축이 습관이 됩니다.",
  applicationName: "Monari",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Monari",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#25273a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body data-theme="parent" className="min-h-screen antialiased">
        <Providers>{children}</Providers>
        <NativeRuntime />
        <InstallAppPrompt />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
