/**
 * 森ログカード選び用サムネを、本番と同じサンドイッチで合成する。
 * 背景 → 写真 → オーバーレイ → 文字
 *
 * Usage: npx tsx scripts/compose-mori-log-picker-previews.ts
 */
import fs from "node:fs";
import path from "node:path";

import sharp from "sharp";

import {
  buildJournalSocialPostImageInput,
  compositeJournalSocialPostImage,
} from "../src/lib/journal/social-post-image/compositeImage";
import {
  MORI_ASHIATO_TEMPLATE_IDS,
  moriLogPickerPreviewFileName,
  type MoriAshiatoTemplateId,
} from "../src/lib/journal/social-post-image/moriAshiatoTemplates";
import { resolveJournalSocialPostDesignSize } from "../src/lib/journal/social-post-image/templates";
import { JOURNAL_SOCIAL_POST_TEMPLATES } from "../src/lib/journal/social-post-image/templates";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/images/journal-social-post");
const DEMO_PHOTO = path.join(ROOT, "public/images/home-mock/demo-journal-photo.png");
/** 一覧用に長辺を抑える（実ファイルは軽めに） */
const PICKER_MAX_EDGE = 720;

const DEMO_CREATED_AT = new Date("2026-07-20T12:00:00+09:00");

type DemoSlots = {
  title: string;
  bodyExcerpt: string;
  commentExcerpt: string;
  promptLabel?: string;
  summary?: string;
};

const DEMO_BY_TEMPLATE: Record<MoriAshiatoTemplateId, DemoSlots> = {
  chiisana_ashiato: {
    title: "モグ",
    bodyExcerpt: "3歳",
    commentExcerpt: "きょうも元気いっぱい",
  },
  kyou_no_ashiato: {
    title: "きょうのひとこま",
    bodyExcerpt: "おうち",
    commentExcerpt: "ぽかぽかだった",
    promptLabel: "ひとことメモ",
  },
  odekake_ashiato: {
    title: "○○公園",
    bodyExcerpt: "",
    commentExcerpt: "たのしかったね",
  },
  oishii_ashiato: {
    title: "おうちごはん",
    bodyExcerpt: "いちごパフェ",
    commentExcerpt: "甘くてうれしい",
  },
  totteoki_no_ashiato: {
    title: "とっておきの一枚",
    bodyExcerpt: "",
    commentExcerpt: "この表情が好き",
  },
  kyou_no_ashiato_wide: {
    title: "",
    bodyExcerpt: "",
    commentExcerpt: "きょうもいい一日だった",
  },
  kyou_no_3koma_ashiato: {
    title: "おはようの光",
    bodyExcerpt: "おひるのひと息",
    commentExcerpt: "おやすみ前に",
    summary: "きょうもいい一日",
  },
};

async function composeOne(templateId: MoriAshiatoTemplateId, photoBuffer: Buffer): Promise<void> {
  const demo = DEMO_BY_TEMPLATE[templateId];
  const input = buildJournalSocialPostImageInput({
    templateId,
    title: demo.title,
    bodyExcerpt: demo.bodyExcerpt,
    subtitle: "",
    todayNumber: null,
    monthNumber: null,
    yearNumber: null,
    moodLabel: "",
    commentExcerpt: demo.commentExcerpt,
    promptLabel: demo.promptLabel,
    summary: demo.summary,
    photoBuffer,
    extraPhotoBuffers:
      templateId === "kyou_no_3koma_ashiato" ? [photoBuffer, photoBuffer] : undefined,
    panelPhotoSources:
      templateId === "kyou_no_3koma_ashiato" ? ["main", "extra0", "extra1"] : undefined,
    companionType: "owl",
    createdAt: DEMO_CREATED_AT,
  });

  const { buffer } = await compositeJournalSocialPostImage(input, {
    createdAt: DEMO_CREATED_AT,
  });

  const design = resolveJournalSocialPostDesignSize(JOURNAL_SOCIAL_POST_TEMPLATES[templateId]);
  const scale = Math.min(1, PICKER_MAX_EDGE / Math.max(design.widthPx, design.heightPx));
  const width = Math.max(1, Math.round(design.widthPx * scale));
  const height = Math.max(1, Math.round(design.heightPx * scale));

  const outName = moriLogPickerPreviewFileName(templateId);
  const outPath = path.join(OUT_DIR, outName);
  await sharp(buffer)
    .resize(width, height)
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(outPath);
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`wrote ${outName} (${width}×${height}, ${sizeKb}KB)`);
}

async function main() {
  if (!fs.existsSync(DEMO_PHOTO)) {
    throw new Error(`demo photo missing: ${DEMO_PHOTO}`);
  }
  const photoBuffer = fs.readFileSync(DEMO_PHOTO);
  for (const id of MORI_ASHIATO_TEMPLATE_IDS) {
    await composeOne(id, photoBuffer);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
