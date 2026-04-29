/**
 * sample-booklet.pdf からテキストを取り出し、標準出力へ出す（ターミナル内確認用）。
 *
 * 使い方:
 *   npm run pdf:sample:text
 *   npm run pdf:sample:text | less
 *
 * 先に PDF を生成: npx tsx scripts/render-sample-booklet.tsx
 */

import fs from "node:fs";
import path from "node:path";

import pdf from "pdf-parse";

async function main() {
  const pdfPath = path.join(process.cwd(), "sample-booklet.pdf");
  if (!fs.existsSync(pdfPath)) {
    console.error(`見つかりません: ${pdfPath}`);
    console.error("先に次を実行してください: npx tsx scripts/render-sample-booklet.tsx");
    process.exit(1);
  }

  const buf = fs.readFileSync(pdfPath);
  const data = await pdf(buf);
  const text = (data.text ?? "").trim();

  console.error(`[sample-booklet] ${data.numpages} ページ分のテキストを標準出力に出力します（| less で閲覧可）。\n`);

  if (!text) {
    console.error("（テキストが空でした。レイアウト主体の PDF の場合、抽出できないことがあります。）");
    process.exit(0);
  }

  process.stdout.write(data.text);
  if (!data.text.endsWith("\n")) process.stdout.write("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
