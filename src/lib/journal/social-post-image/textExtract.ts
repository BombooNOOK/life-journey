/** SNS 投稿画像用テキスト抜粋（クライアントでも利用可） */

import type { JournalSocialPostTemplateId } from "./templates";

/** @deprecated SOCIAL_POST_BODY_MAX_CHARS_SNS02 を使用 */
export const SOCIAL_POST_BODY_MAX_CHARS = 50;
export const SOCIAL_POST_BODY_MAX_CHARS_SNS02 = 50;
/** sns03 本文枠（16字×6行・装飾分込み）に合わせた上限 */
export const SOCIAL_POST_BODY_MAX_CHARS_SNS03 = 93;
export const SOCIAL_POST_COMMENT_MAX_CHARS = 45;

/** 最初に現れる文の切れ目（。！？ など） */
const FIRST_SENTENCE_END = /(?:！？|！\?|\?!|。|！|？|\?|!)/;

export function normalizeSocialPostText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function truncateWithEllipsis(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

function splitSentences(normalized: string): string[] {
  const sentences: string[] = [];
  let rest = normalized;

  while (rest.length > 0) {
    const match = FIRST_SENTENCE_END.exec(rest);
    if (match && match.index != null) {
      sentences.push(rest.slice(0, match.index + match[0].length));
      rest = rest.slice(match.index + match[0].length).trimStart();
    } else {
      sentences.push(rest);
      break;
    }
  }

  return sentences;
}

/**
 * 句点区切りの文を先頭から連結し、上限まで抜き出す。
 * maxSentences=1 のときは従来どおり1文のみ。
 */
function extractSentenceExcerpt(
  normalized: string,
  maxChars: number,
  maxSentences: number,
): string {
  if (!normalized) return "";

  const sentences = splitSentences(normalized);
  if (sentences.length === 0) return "";

  if (maxSentences === 1) {
    const first = sentences[0]!;
    if (first.length <= maxChars) return first;
    return truncateWithEllipsis(first, maxChars);
  }

  let result = "";
  let sentenceCount = 0;
  for (const sentence of sentences) {
    if (sentenceCount >= maxSentences) break;
    const candidate = result + sentence;
    if (candidate.length <= maxChars) {
      result = candidate;
      sentenceCount += 1;
      continue;
    }
    if (!result) {
      return truncateWithEllipsis(sentence, maxChars);
    }
    break;
  }

  if (result) return result;
  return truncateWithEllipsis(normalized, maxChars);
}

function finalizeSns03BodyExcerpt(normalized: string, excerpt: string, maxChars: number): string {
  if (!excerpt) return "";
  if (excerpt.length > maxChars) return truncateWithEllipsis(excerpt, maxChars);
  if (excerpt.length < normalized.length) {
    if (excerpt.endsWith("…")) return excerpt;
    const withEllipsis = `${excerpt}…`;
    return withEllipsis.length <= maxChars ? withEllipsis : truncateWithEllipsis(excerpt, maxChars);
  }
  return excerpt;
}

/** 日記本文：sns02 は1文、sns03 は句点区切りで枠内上限まで。 */
export function extractSocialPostBodyText(
  content: string,
  templateId: JournalSocialPostTemplateId = "sns02",
): string {
  const normalized = normalizeSocialPostText(content);
  if (templateId === "sns03") {
    const excerpt = extractSentenceExcerpt(
      normalized,
      SOCIAL_POST_BODY_MAX_CHARS_SNS03,
      Number.POSITIVE_INFINITY,
    );
    return finalizeSns03BodyExcerpt(normalized, excerpt, SOCIAL_POST_BODY_MAX_CHARS_SNS03);
  }
  return extractSentenceExcerpt(normalized, SOCIAL_POST_BODY_MAX_CHARS_SNS02, 1);
}

/** 鑑定士のひとこと：最初の文区切りまで、または文字数上限。 */
export function extractSocialPostCommentText(comment: string): string {
  return extractSentenceExcerpt(
    normalizeSocialPostText(comment.replace(/\n+/g, " ")),
    SOCIAL_POST_COMMENT_MAX_CHARS,
    1,
  );
}

/** 投稿画像：下部のサブタイトル（日記本文とは別・未入力時の既定文） */
export const DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE = "なんでもない今日の、かわいい記録";

/** 角丸横長：1行に収める上限（改行させない） */
export const SOCIAL_POST_TITLE_MAX_CHARS_SNS02 = 14;
/** スクエア：大見出しは1行・10文字まで */
export const SOCIAL_POST_TITLE_MAX_CHARS_SNS03 = 10;
export const SOCIAL_POST_SUBTITLE_MAX_CHARS = 36;

/** @deprecated テンプレ別の定数を使ってください */
export const SOCIAL_POST_TITLE_MAX_CHARS = SOCIAL_POST_TITLE_MAX_CHARS_SNS03;

export function socialPostTitleMaxChars(templateId: "sns02" | "sns03"): number {
  return templateId === "sns03"
    ? SOCIAL_POST_TITLE_MAX_CHARS_SNS03
    : SOCIAL_POST_TITLE_MAX_CHARS_SNS02;
}

export function clampJournalSocialPostTitle(
  raw: string,
  templateId: "sns02" | "sns03",
): string {
  return normalizeSocialPostText(raw).slice(0, socialPostTitleMaxChars(templateId));
}

export function resolveJournalSocialPostSubtitle(raw: string | null | undefined): string {
  const trimmed = normalizeSocialPostText(raw ?? "");
  return trimmed || DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE;
}
