import type { CapacitorConfig } from "@capacitor/cli";

/**
 * WebView で表示する LJD の URL。
 * 未設定時は capacitor-www のプレースホルダを表示（本番 URL 直結はしない）。
 *
 * 例:
 *   CAPACITOR_SERVER_URL=http://127.0.0.1:3000 npm run cap:sync
 *   CAPACITOR_SERVER_URL=https://your-preview.vercel.app npm run cap:sync
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() ?? "";
const useRemoteServer = serverUrl.length > 0;
const isHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "app.bamboonook.ljd",
  appName: "Life Journey Diary",
  webDir: "capacitor-www",
  ...(useRemoteServer
    ? {
        server: {
          url: serverUrl,
          cleartext: isHttp,
          androidScheme: isHttp ? "http" : "https",
        },
      }
    : {}),
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
  },
  android: {
    allowMixedContent: isHttp,
  },
};

export default config;
