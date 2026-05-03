import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
