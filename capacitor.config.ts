import type { CapacitorConfig } from "@capacitor/cli";

const productionUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.monari.family",
  appName: "Monari",
  webDir: "native-shell",
  server: productionUrl
    ? {
        url: productionUrl,
        cleartext: false,
        allowNavigation: [new URL(productionUrl).hostname],
      }
    : undefined,
  android: {
    allowMixedContent: false,
    backgroundColor: "#f5f6f8",
  },
  ios: {
    backgroundColor: "#f5f6f8",
    contentInset: "automatic",
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: "#25273aff",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#f5f6f8",
    },
  },
};

export default config;
