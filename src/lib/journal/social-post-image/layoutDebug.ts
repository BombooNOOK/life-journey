import {
  buildLayoutGridSvg as buildDailyNumberLayoutGridSvg,
} from "@/lib/admin/post-atelier/daily-number/layoutDebug";

import {
  JOURNAL_SOCIAL_POST_TEMPLATE_SIZE,
  JOURNAL_SOCIAL_POST_TEMPLATES,
  type JournalSocialPostTemplateId,
  type JournalSocialPostTextStyle,
} from "./templates";

/** 日記プレビュー・こころ予報定規と同じ：設計座標上の 1 辺 5px */
export const JOURNAL_SOCIAL_POST_LAYOUT_RULER_SQUARE_PX = 5;

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
}[] = [
  { id: "sns02", label: "ひだまりフォト（横長）", templateFile: "sns02-template-base-drfukuro.png" },
  { id: "sns03", label: "森のスクラップ（スクエア）", templateFile: "sns03-template-base-drfukuro.png" },
];

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
    anchors.push(anchorFromStyle("date", "日付（方眼紙）", layout.dateScrapbook));
  }

  anchors.push(anchorFromStyle("title", "タイトル", layout.title));
  if (templateId === "sns03" && layout.subtitle) {
    anchors.push(anchorFromStyle("subtitle", "サブタイトル（緑帯）", layout.subtitle));
  }
  anchors.push(
    anchorFromStyle("body", "本文抜粋", layout.body),
    anchorFromStyle("number-day", "今日のすうじ（日）", layout.numberSlots[0]!),
    anchorFromStyle("number-month", "今日のすうじ（月）", layout.numberSlots[1]!),
    anchorFromStyle("number-year", "今日のすうじ（年）", layout.numberSlots[2]!),
    anchorFromStyle("mood", "きもちの記録", layout.mood),
    anchorFromStyle("comment", "鑑定士のひとこと", layout.comment),
  );

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

  push("title", SAMPLE.title, layout.title);
  if (templateId === "sns03" && layout.subtitle) {
    push("subtitle", SAMPLE.subtitle, layout.subtitle);
  }
  push(
    "body",
    templateId === "sns03" ? SAMPLE.body : SAMPLE.body,
    layout.body,
  );
  push("number-day", SAMPLE.numbers[0], layout.numberSlots[0]!);
  push("number-month", SAMPLE.numbers[1], layout.numberSlots[1]!);
  push("number-year", SAMPLE.numbers[2], layout.numberSlots[2]!);
  push("mood", SAMPLE.mood, layout.mood);
  push("comment", SAMPLE.comment, layout.comment);

  return items;
}

export function photoRectForTemplate(templateId: JournalSocialPostTemplateId) {
  return JOURNAL_SOCIAL_POST_TEMPLATES[templateId].photo;
}

export function buildJournalSocialPostLayoutGridSvg(): string {
  return buildDailyNumberLayoutGridSvg({
    width: JOURNAL_SOCIAL_POST_TEMPLATE_SIZE.widthPx,
    height: JOURNAL_SOCIAL_POST_TEMPLATE_SIZE.heightPx,
  });
}

export function buildJournalSocialPostLayoutRulerSquareSvg(input: {
  x: number;
  y: number;
  size?: number;
  label?: string;
}): string {
  const size = input.size ?? JOURNAL_SOCIAL_POST_LAYOUT_RULER_SQUARE_PX;
  const label = input.label ?? `${size}px`;
  const { widthPx, heightPx } = JOURNAL_SOCIAL_POST_TEMPLATE_SIZE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${widthPx}" height="${heightPx}" viewBox="0 0 ${widthPx} ${heightPx}">
<rect x="${input.x}" y="${input.y}" width="${size}" height="${size}" fill="rgba(217,70,239,0.85)" stroke="#a21caf" stroke-width="1" />
<text x="${input.x + size + 4}" y="${input.y + size - 1}" font-family="monospace" font-size="10" fill="#86198f">${label} @ ${input.x},${input.y}</text>
</svg>`;
}
