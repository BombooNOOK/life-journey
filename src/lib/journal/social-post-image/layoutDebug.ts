import {
  buildLayoutGridSvg as buildDailyNumberLayoutGridSvg,
} from "@/lib/admin/post-atelier/daily-number/layoutDebug";

import {
  JOURNAL_SOCIAL_POST_TEMPLATE_IDS,
  JOURNAL_SOCIAL_POST_TEMPLATE_SIZE,
  JOURNAL_SOCIAL_POST_TEMPLATES,
  resolveJournalSocialPostDesignSize,
  type JournalSocialPostPhotoStyle,
  type JournalSocialPostTemplateId,
  type JournalSocialPostTextStyle,
} from "./templates";

/** あしあとプレビュー・こころ予報定規と同じ：設計座標上の 1 辺 5px */
export const JOURNAL_SOCIAL_POST_LAYOUT_RULER_SQUARE_PX = 5;

export type DesignSizePx = { widthPx: number; heightPx: number };

export function designSizeForTemplate(
  templateId: JournalSocialPostTemplateId,
): DesignSizePx {
  return resolveJournalSocialPostDesignSize(JOURNAL_SOCIAL_POST_TEMPLATES[templateId]);
}

export type LayoutAnchor = {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "point" | "topleft";
};

export const JOURNAL_SOCIAL_POST_LAYOUT_SLIDES: {
  id: JournalSocialPostTemplateId;
  label: string;
  templateFile: string;
  overlayFile?: string;
}[] = JOURNAL_SOCIAL_POST_TEMPLATE_IDS.map((id) => {
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[id];
  return {
    id: layout.id,
    label: layout.label,
    templateFile: layout.backgroundFile,
    overlayFile: layout.photoOverlayFile,
  };
});

const SAMPLE = {
  title: "イスの下からこんにちは",
  body: "今日はモグの病院最終日。",
  subtitle: "なんでもない今日の、かわいい記録",
  numbers: ["4", "3", "6"] as const,
  mood: "移動・おでかけをした",
  comment: "動いたことが、やさしく次の流れにつながる日。",
  dateRibbonYear: "2026",
  dateRibbonMonthDay: "6.19",
  dateScrapbook: "2026.6.19 (金)",
} as const;

function anchorFromStyle(
  id: string,
  label: string,
  style: JournalSocialPostTextStyle,
): LayoutAnchor {
  const kind = style.textAnchor === "middle" ? "point" : "topleft";
  return { id, label, x: style.x, y: style.y, kind };
}

export function layoutAnchorsForTemplate(templateId: JournalSocialPostTemplateId): LayoutAnchor[] {
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[templateId];
  const anchors: LayoutAnchor[] = [
    {
      id: "photo",
      label: `写真（${layout.photo.width}×${layout.photo.height}）`,
      x: layout.photo.x,
      y: layout.photo.y,
      kind: "topleft",
    },
  ];

  if (layout.dateRibbonYear) {
    anchors.push(anchorFromStyle("date-year", "日付・年（リボン）", layout.dateRibbonYear));
  }
  if (layout.dateRibbonMonthDay) {
    anchors.push(anchorFromStyle("date-md", "日付・月.日（リボン）", layout.dateRibbonMonthDay));
  }
  if (layout.dateScrapbook) {
    const dateLabel =
      layout.textMode === "ashiato_lines" ? "日付" : "日付（方眼紙）";
    anchors.push(anchorFromStyle("date", dateLabel, layout.dateScrapbook));
  }

  if (layout.title.fontSize > 1) {
    anchors.push(anchorFromStyle("title", "タイトル", layout.title));
  }
  if (layout.subtitle) {
    anchors.push(anchorFromStyle("subtitle", "サブタイトル（緑帯）", layout.subtitle));
  }
  if (layout.body.fontSize > 1) {
    const bodyLabel =
      layout.textMode === "ashiato_lines" ? "本文" : "本文抜粋";
    anchors.push(anchorFromStyle("body", bodyLabel, layout.body));
  }
  if (layout.numberSlots) {
    anchors.push(
      anchorFromStyle("number-day", "今日のすうじ（日）", layout.numberSlots[0]),
      anchorFromStyle("number-month", "今日のすうじ（月）", layout.numberSlots[1]),
      anchorFromStyle("number-year", "今日のすうじ（年）", layout.numberSlots[2]),
    );
  }
  if (layout.mood) {
    anchors.push(anchorFromStyle("mood", "きもちの記録", layout.mood));
  }
  if (layout.comment.fontSize > 1) {
    anchors.push(anchorFromStyle("comment", "ひとこと", layout.comment));
  }

  for (const [index, extra] of (layout.extraPhotos ?? []).entries()) {
    anchors.push({
      id: `photo-extra-${index + 2}`,
      label: `写真${index + 2}（${extra.width}×${extra.height}）`,
      x: extra.x,
      y: extra.y,
      kind: "topleft",
    });
  }

  if (layout.companionFace) {
    anchors.push({
      id: "companion-face",
      label: `伴走キャラ顔（${layout.companionFace.sizePx}px）`,
      x: layout.companionFace.x,
      y: layout.companionFace.y,
      kind: layout.companionFace.textAnchor === "middle" ? "point" : "topleft",
    });
  }

  return anchors;
}

export function layoutSampleTextsForTemplate(templateId: JournalSocialPostTemplateId): Array<{
  id: string;
  text: string;
  x: number;
  y: number;
  kind: "point" | "topleft";
  fontSize: number;
  fontWeight?: 400 | 600;
  fill?: string;
}> {
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[templateId];
  const items: Array<{
    id: string;
    text: string;
    x: number;
    y: number;
    kind: "point" | "topleft";
    fontSize: number;
    fontWeight?: 400 | 600;
    fill?: string;
  }> = [];

  const push = (id: string, text: string, style: JournalSocialPostTextStyle) => {
    items.push({
      id,
      text,
      x: style.x,
      y: style.y,
      kind: style.textAnchor === "middle" ? "point" : "topleft",
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fill: style.fill,
    });
  };

  if (layout.dateRibbonYear) push("date-year", SAMPLE.dateRibbonYear, layout.dateRibbonYear);
  if (layout.dateRibbonMonthDay) push("date-md", SAMPLE.dateRibbonMonthDay, layout.dateRibbonMonthDay);
  if (layout.dateScrapbook) push("date", SAMPLE.dateScrapbook, layout.dateScrapbook);

  if (layout.title.fontSize > 1) {
    push("title", SAMPLE.title, layout.title);
  }
  if (layout.subtitle) {
    push("subtitle", SAMPLE.subtitle, layout.subtitle);
  }
  if (layout.body.fontSize > 1) {
    push("body", SAMPLE.body, layout.body);
  }
  if (layout.numberSlots) {
    push("number-day", SAMPLE.numbers[0], layout.numberSlots[0]);
    push("number-month", SAMPLE.numbers[1], layout.numberSlots[1]);
    push("number-year", SAMPLE.numbers[2], layout.numberSlots[2]);
  }
  if (layout.mood) {
    push("mood", SAMPLE.mood, layout.mood);
  }
  if (layout.comment.fontSize > 1) {
    push("comment", SAMPLE.comment, layout.comment);
  }

  return items;
}

export function photoRectForTemplate(templateId: JournalSocialPostTemplateId) {
  return JOURNAL_SOCIAL_POST_TEMPLATES[templateId].photo;
}

/** 1枠目＋extraPhotos（3コマなど） */
export function photoRectsForTemplate(
  templateId: JournalSocialPostTemplateId,
): JournalSocialPostPhotoStyle[] {
  const layout = JOURNAL_SOCIAL_POST_TEMPLATES[templateId];
  return [layout.photo, ...(layout.extraPhotos ?? [])];
}

export function buildJournalSocialPostLayoutGridSvg(
  size: DesignSizePx = JOURNAL_SOCIAL_POST_TEMPLATE_SIZE,
): string {
  return buildDailyNumberLayoutGridSvg({
    width: size.widthPx,
    height: size.heightPx,
  });
}

export function buildJournalSocialPostLayoutRulerSquareSvg(input: {
  x: number;
  y: number;
  size?: number;
  label?: string;
  canvas?: DesignSizePx;
}): string {
  const size = input.size ?? JOURNAL_SOCIAL_POST_LAYOUT_RULER_SQUARE_PX;
  const label = input.label ?? `${size}px`;
  const { widthPx, heightPx } = input.canvas ?? JOURNAL_SOCIAL_POST_TEMPLATE_SIZE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
<rect x="${input.x}" y="${input.y}" width="${size}" height="${size}" fill="rgba(217,70,239,0.85)" stroke="#a21caf" stroke-width="1" />
<text x="${input.x + size + 4}" y="${input.y + size - 1}" font-family="monospace" font-size="10" fill="#86198f">${label} @ ${input.x},${input.y}</text>
</svg>`;
}
