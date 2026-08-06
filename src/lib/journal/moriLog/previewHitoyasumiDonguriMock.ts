/**
 * /preview/hitoyasumi 実機確認用。本番のどんぐり確定 API は呼ばない。
 *
 * 有効条件（すべて必須）:
 * - process.env.NODE_ENV === "development"（production ビルドでは常に false）
 * - profileId === "preview-hitoyasumi"（ページ固定）
 * - pathname が /preview/hitoyasumi で始まる
 *
 * 無効例: /orders/hitoyasumi、本番デプロイ、別 profileId、URL クエリのみ。
 */

export const PREVIEW_HITOYASUMI_PROFILE_ID = "preview-hitoyasumi" as const;

export function shouldMockPreviewHitoyasumiDonguri(
  profileId: string,
  options?: { pathname?: string; nodeEnv?: string },
): boolean {
  const nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV;
  if (nodeEnv !== "development") return false;
  if (profileId.trim() !== PREVIEW_HITOYASUMI_PROFILE_ID) return false;

  const pathname =
    options?.pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  if (!pathname.startsWith("/preview/hitoyasumi")) return false;

  return true;
}
