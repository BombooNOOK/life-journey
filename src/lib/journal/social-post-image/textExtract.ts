/** SNS 投稿画像用テキスト抜粋（クライアントでも利用可） */

export const SOCIAL_POST_BODY_MAX_CHARS = 50;
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

/**
 * 最初の文区切りまで抜き出し、上限を超える場合は … で締める。
 * 区切りがなく上限に達した場合も … で締める。
 */
function extractFirstSentenceExcerpt(normalized: string, maxChars: number): string {
  if (!normalized) return "";

  const match = FIRST_SENTENCE_END.exec(normalized);
  const firstSentence =
    match && match.index != null
      ? normalized.slice(0, match.index + match[0].length)
      : null;

  if (firstSentence && firstSentence.length <= maxChars) {
    return firstSentence;
  }

  const source = firstSentence ?? normalized;
  return truncateWithEllipsis(source, maxChars);
}

/** 日記本文：最初の文区切りまで。長い／区切りなしは … で締める。 */
export function extractSocialPostBodyText(content: string): string {
  return extractFirstSentenceExcerpt(
    normalizeSocialPostText(content),
    SOCIAL_POST_BODY_MAX_CHARS,
  );
}

/** 鑑定士のひとこと：最初の文区切りまで、または文字数上限。 */
export function extractSocialPostCommentText(comment: string): string {
  return extractFirstSentenceExcerpt(
    normalizeSocialPostText(comment.replace(/\n+/g, " ")),
    SOCIAL_POST_COMMENT_MAX_CHARS,
  );
}
