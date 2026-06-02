import type { NextConfig } from "next";

const lanDevHost =
  process.env.NEXT_PUBLIC_APP_URL?.trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .split(":")[0] || "192.168.1.28";

const nextConfig: NextConfig = {
  /** iPhone 等から LAN IP で dev する際の _next 静的アセット用 */
  allowedDevOrigins: ["127.0.0.1", "localhost", lanDevHost],
  /** Prisma をバンドルに取り込まない（クライアント不整合・検証エラー回避） */
  serverExternalPackages: ["@prisma/client", "@react-pdf/renderer"],
  /**
   * Firebase `signInWithPopup` が親ページの COOP 厳しめ設定で黙って失敗することがある（特に iOS Safari）。
   * ログイン画面だけポップアップ完了を許容する値にする。
   */
  async headers() {
    return [
      {
        source: "/login",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
