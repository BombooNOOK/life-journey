import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// pdf-parse の index は ESM 直実行時にテスト PDF を読みに行くため、実装を直接読む
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const pdfPath = path.join(process.cwd(), "data/鑑定書用石説明改訂版v4.pdf");
const outPath = path.join(process.cwd(), "scripts/stonePdfV4-raw.txt");

const buf = fs.readFileSync(pdfPath);
const res = await pdfParse(buf);
fs.writeFileSync(outPath, res.text, "utf8");
process.stdout.write(`Wrote ${outPath} (${res.text.length} chars, ${res.numpages} pages)\n`);
