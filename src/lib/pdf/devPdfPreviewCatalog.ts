export type PdfPreviewQuality = "low" | "high";

export type DevPdfPreviewVariant = {
  value: string;
  label: string;
};

export type DevPdfPreviewEntry = {
  id: string;
  group: string;
  label: string;
  note?: string;
  /** 初回レンダが重い（サンプル冊子など） */
  slow?: boolean;
  defaultVariant?: string;
  variants?: DevPdfPreviewVariant[];
  buildSrc: (opts: { quality: PdfPreviewQuality; variant?: string }) => string;
};

const CORE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;
const BIRTHDAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22] as const;

function q(quality: PdfPreviewQuality) {
  return quality === "high" ? "high" : "low";
}

function coreVariants(prefix: string): DevPdfPreviewVariant[] {
  return CORE_NUMBERS.map((n) => ({ value: String(n), label: `${prefix}${n}` }));
}

function birthdayVariants(): DevPdfPreviewVariant[] {
  return BIRTHDAY_NUMBERS.map((n) => ({ value: String(n), label: `B${n}` }));
}

const GUIDE_KEYS: { key: string; label: string }[] = [
  { key: "lifePath", label: "ライフパス「とは」" },
  { key: "destiny", label: "ディスティニー「とは」" },
  { key: "soul", label: "ソウル「とは」" },
  { key: "personality", label: "パーソナリティ「とは」" },
  { key: "birthday", label: "バースデー「とは」" },
  { key: "maturity", label: "マチュリティ「とは」" },
  { key: "personalYear", label: "パーソナルイヤー「とは」" },
];

/** `/api/dev/*-preview` の一覧（`npm run dev` 中のみ） */
export const DEV_PDF_PREVIEW_ENTRIES: DevPdfPreviewEntry[] = [
  {
    id: "cover",
    group: "冊子",
    label: "表紙",
    buildSrc: ({ quality }) => `/api/dev/cover-preview?quality=${q(quality)}`,
  },
  {
    id: "inside-cover",
    group: "冊子",
    label: "中表紙（扉絵）",
    buildSrc: ({ quality }) => `/api/dev/inside-cover-preview?quality=${q(quality)}`,
  },
  {
    id: "chapter-divider",
    group: "章扉",
    label: "章扉",
    defaultVariant: "1",
    variants: [
      { value: "1", label: "第1章" },
      { value: "2", label: "第2章" },
      { value: "3", label: "第3章" },
      { value: "4", label: "第4章" },
    ],
    buildSrc: ({ quality, variant }) =>
      `/api/dev/chapter-divider-preview?chapter=${variant ?? "1"}&quality=${q(quality)}`,
  },
  {
    id: "sample-booklet",
    group: "冊子",
    label: "サンプル冊子（全文）",
    note: "初回 1〜2 分かかることがあります",
    slow: true,
    buildSrc: ({ quality }) => `/api/dev/sample-booklet?quality=${q(quality)}`,
  },
  {
    id: "introduction-page1",
    group: "はじめに",
    label: "はじめに 1P",
    buildSrc: ({ quality }) =>
      `/api/dev/introduction-preview?page=page1&quality=${q(quality)}`,
  },
  {
    id: "introduction-page2",
    group: "はじめに",
    label: "案内人 2P",
    buildSrc: ({ quality }) =>
      `/api/dev/introduction-preview?page=page2&quality=${q(quality)}`,
  },
  ...GUIDE_KEYS.map(({ key, label }) => ({
    id: `guide-${key}`,
    group: "コア「とは」",
    label,
    buildSrc: ({ quality }: { quality: PdfPreviewQuality }) =>
      `/api/dev/number-guide-preview?key=${key}&quality=${q(quality)}`,
  })),
  {
    id: "core-intro",
    group: "コア中間扉",
    label: "コア中間扉",
    defaultVariant: "lifePath",
    variants: [
      { value: "lifePath", label: "ライフパス" },
      { value: "destiny", label: "ディスティニー" },
      { value: "soul", label: "ソウル" },
      { value: "personality", label: "パーソナリティ" },
      { value: "birthday", label: "バースデー" },
      { value: "maturity", label: "マチュリティ" },
    ],
    buildSrc: ({ quality, variant }) =>
      `/api/dev/core-number-intro-preview?core=${variant ?? "lifePath"}&quality=${q(quality)}`,
  },
  {
    id: "body-soul",
    group: "コア本文",
    label: "ソウル（本文）",
    defaultVariant: "1",
    variants: coreVariants("S"),
    buildSrc: ({ quality, variant }) =>
      `/api/dev/soul-preview?soul=${variant ?? "1"}&quality=${q(quality)}`,
  },
  {
    id: "body-destiny",
    group: "コア本文",
    label: "ディスティニー（本文）",
    defaultVariant: "1",
    variants: coreVariants("D"),
    buildSrc: ({ quality, variant }) =>
      `/api/dev/destiny-preview?destiny=${variant ?? "1"}&quality=${q(quality)}`,
  },
  {
    id: "body-personality",
    group: "コア本文",
    label: "パーソナリティ（本文）",
    defaultVariant: "1",
    variants: coreVariants("P"),
    buildSrc: ({ quality, variant }) =>
      `/api/dev/personality-preview?personality=${variant ?? "1"}&quality=${q(quality)}`,
  },
  {
    id: "body-birthday",
    group: "コア本文",
    label: "バースデー（本文）",
    defaultVariant: "1",
    variants: birthdayVariants(),
    buildSrc: ({ quality, variant }) =>
      `/api/dev/birthday-preview?birthday=${variant ?? "1"}&quality=${q(quality)}`,
  },
  {
    id: "py-message",
    group: "パーソナルイヤー",
    label: "PY 章頭メッセージ",
    buildSrc: ({ quality }) =>
      `/api/dev/personal-year-message-preview?quality=${q(quality)}`,
  },
  {
    id: "py-after-message",
    group: "パーソナルイヤー",
    label: "PY 章後フクロウ",
    buildSrc: ({ quality }) =>
      `/api/dev/personal-year-after-message-preview?quality=${q(quality)}`,
  },
  {
    id: "bridge-guide-1",
    group: "ブリッジ",
    label: "ブリッジ「とは」1P",
    buildSrc: ({ quality }) =>
      `/api/dev/bridge-guide-preview?page=page1&quality=${q(quality)}`,
  },
  {
    id: "bridge-guide-2",
    group: "ブリッジ",
    label: "ブリッジ「とは」2P",
    buildSrc: ({ quality }) =>
      `/api/dev/bridge-guide-preview?page=page2&quality=${q(quality)}`,
  },
  {
    id: "bridge-after-message",
    group: "ブリッジ",
    label: "ブリッジ章後メッセージ",
    buildSrc: ({ quality }) =>
      `/api/dev/bridge-after-message-preview?quality=${q(quality)}`,
  },
  {
    id: "journal-priorities",
    group: "第4章・日記",
    label: "この年大切にしたいこと",
    buildSrc: ({ quality }) =>
      `/api/dev/journal-priorities-preview?quality=${q(quality)}`,
  },
  {
    id: "journal-retrospect",
    group: "第4章・日記",
    label: "この年を振り返って",
    buildSrc: ({ quality }) =>
      `/api/dev/journal-retrospect-preview?quality=${q(quality)}`,
  },
  {
    id: "journal-memo-left",
    group: "第4章・日記",
    label: "余白のページ（左・方眼）",
    buildSrc: ({ quality }) =>
      `/api/dev/journal-memo-preview?page=left&quality=${q(quality)}`,
  },
  {
    id: "journal-memo-right",
    group: "第4章・日記",
    label: "余白のページ（右・フクロウ）",
    buildSrc: ({ quality }) =>
      `/api/dev/journal-memo-preview?page=right&quality=${q(quality)}`,
  },
  {
    id: "journal-diary-invite",
    group: "第4章・日記",
    label: "フクロウ先生メッセージ＋日記案内",
    buildSrc: ({ quality }) =>
      `/api/dev/journal-diary-invite-preview?quality=${q(quality)}`,
  },
  {
    id: "afterword-left",
    group: "おわりに",
    label: "おわりに（左・タイトル＋本文）",
    buildSrc: ({ quality }) =>
      `/api/dev/afterword-preview?page=left&quality=${q(quality)}`,
  },
  {
    id: "afterword-right",
    group: "おわりに",
    label: "おわりに（右・本文）",
    buildSrc: ({ quality }) =>
      `/api/dev/afterword-preview?page=right&quality=${q(quality)}`,
  },
];

export const DEV_PDF_PREVIEW_GROUPS = [
  ...new Set(DEV_PDF_PREVIEW_ENTRIES.map((e) => e.group)),
];

export function findDevPdfPreviewEntry(id: string): DevPdfPreviewEntry | undefined {
  return DEV_PDF_PREVIEW_ENTRIES.find((e) => e.id === id);
}
