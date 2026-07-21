import type { CapacitorConfig } from "@capacitor/cli";

const PRODUCTION_URL = "https://kids-money-os.vercel.app";

const config: CapacitorConfig = {
  appId: "com.monari.family",
  appName: "모나리",
  webDir: "native-shell",
  server: {
    url: PRODUCTION_URL,
    cleartext: false,
    allowNavigation: [new URL(PRODUCTION_URL).hostname],
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#ffffff",
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: "#ffffff",
    contentInset: "automatic",
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
