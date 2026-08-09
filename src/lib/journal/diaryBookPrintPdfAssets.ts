import fs from "node:fs";
import path from "node:path";

/** `/images/...?v=9` 形式の Web パスをサーバー上の絶対パスへ */
export function resolveDiaryBookPublicImagePath(webPath: string): string {
  const clean = webPath.split("?")[0]?.trim() ?? "";
  if (!clean.startsWith("/images/")) {
    throw new Error(`あしあとブック画像パスが不正です: ${webPath}`);
  }
  const abs = path.join(process.cwd(), "public", clean.replace(/^\//, ""));
  if (!fs.existsSync(abs)) {
    throw new Error(`あしあとブック画像が見つかりません: ${clean}`);
  }
  return abs;
}
