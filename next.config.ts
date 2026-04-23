import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Prisma をバンドルに取り込まない（クライアント不整合・検証エラー回避） */
  serverExternalPackages: ["@prisma/client", "@react-pdf/renderer"],
};

export default nextConfig;
