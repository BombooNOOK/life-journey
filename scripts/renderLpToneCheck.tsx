/**
 * LP1 / LP4 / LP11 のライフパスPDF1ページをレンダし、抽出テキストに本文冒頭が含まれるか確認する。
 * 実行: npx tsx scripts/renderLpToneCheck.tsx
 */
import "./pdf-react-shim";
import { Document } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";
import pdfParse from "pdf-parse";

import { LifePathPage } from "../src/components/pdf/pages/LifePathPage";
import { ensureJapaneseFont } from "../src/components/pdf/registerFonts";
import { getLifePathArticle } from "../src/lib/numerology/lifePathData";

const CHECK: number[] = [1, 4, 11];

async function main(): Promise<void> {
  ensureJapaneseFont();

  for (const lp of CHECK) {
    const article = getLifePathArticle(lp);
    if (!article) throw new Error(`no article for ${lp}`);
    const snippet = article.sections.basic.slice(0, 48).replace(/\s/g, "");

    const buf = await renderToBuffer(
      <Document>
        <LifePathPage lifePath={lp} />
      </Document>,
    );
    const parsed = await pdfParse(Buffer.from(buf));
    const flat = parsed.text.replace(/\s/g, "");

    const ok = flat.includes(snippet);
    console.log(
      `LP${lp}: PDFに basic 冒頭一致 → ${ok ? "OK" : "NG"}`,
      ok ? "" : `\n  expected fragment: ${snippet.slice(0, 36)}…`,
    );
    if (!ok) {
      console.log("  pdf text sample:", flat.slice(0, 200).replace(/\n/g, " "));
      process.exitCode = 1;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
