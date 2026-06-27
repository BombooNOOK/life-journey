import { JOURNAL_SOCIAL_POST_IMAGE_SIZE } from "./types";

export const JOURNAL_SOCIAL_POST_LAYOUT = {
  photo: { x: 72, y: 72, width: 936, height: 640 },
  date: { x: 96, y: 748, fontSize: 32, lineHeight: 40 },
  title: { x: 96, y: 800, fontSize: 48, lineHeight: 62, maxCharsPerLine: 16, maxLines: 2 },
  body: { x: 96, y: 930, fontSize: 34, lineHeight: 46, maxCharsPerLine: 18, maxLines: 3 },
  todayNumberLabel: { x: 96, y: 1088, fontSize: 26, lineHeight: 34 },
  todayNumberValue: { x: 96, y: 1124, fontSize: 40, lineHeight: 48 },
  moodLabel: { x: 420, y: 1088, fontSize: 26, lineHeight: 34 },
  moodValue: { x: 420, y: 1124, fontSize: 34, lineHeight: 42 },
  commentLabel: { x: 96, y: 1198, fontSize: 26, lineHeight: 34 },
  commentBody: { x: 96, y: 1238, fontSize: 28, lineHeight: 38, maxCharsPerLine: 22, maxLines: 2 },
} as const;

export const JOURNAL_SOCIAL_POST_COLORS = {
  primary: "#3d3429",
  secondary: "#6b5f52",
  accent: "#5c4a32",
  muted: "#8a7d70",
} as const;

export { JOURNAL_SOCIAL_POST_IMAGE_SIZE };
