import { LogHouseTourPreviewClient } from "@/components/orders/loghouse-room/LogHouseTourPreviewClient";

export const dynamic = "force-dynamic";

/**
 * はじめてのログハウス案内の通し確認。
 * フィクスチャのみのためログイン不要（Cursor 内ブラウザやリロードでもそのまま確認できる）。
 */
export default function LogHouseTourPreviewPage() {
  return <LogHouseTourPreviewClient />;
}
