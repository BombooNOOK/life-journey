/**
 * Extract compact paste files from transcript (base) and bundled accent text.
 * Run: node scripts/bootstrap-diary-compact-paste.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";

const transcriptPath =
  "/Users/kimurarisa/.cursor/projects/Users-kimurarisa-numerology-mvp/agent-transcripts/5398cadf-e5a0-4c90-8b88-f958b648098e/5398cadf-e5a0-4c90-8b88-f958b648098e.jsonl";

const lines = readFileSync(transcriptPath, "utf8").split("\n");
const baseLine = lines.find((line) => line.includes("No.001 | work_study_1_a"));
if (!baseLine) throw new Error("Base paste not found in transcript");

const baseObj = JSON.parse(baseLine);
let baseText = baseObj.message.content[0].text;
baseText = baseText
  .replace(/^<user_query>\n?/, "")
  .replace(/\n?<\/user_query>$/, "");

mkdirSync("docs", { recursive: true });
writeFileSync("docs/diary-reading-compact-base.paste.txt", baseText, "utf8");
console.log("Wrote docs/diary-reading-compact-base.paste.txt");
