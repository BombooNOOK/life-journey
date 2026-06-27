/** SNS 投稿画像用テキスト抜粋（クライアントでも利用可） */

export const SOCIAL_POST_BODY_MAX_CHARS = 50;
export const SOCIAL_POST_COMMENT_MAX_CHARS = 45;

export function normalizeSocialPostText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** 日記本文：最初の「。」まで。長い場合は省略。 */
export function extractSocialPostBodyText(content: string): string {
  const normalized = normalizeSocialPostText(content);
  if (!normalized) return "";

  const periodIndex = normalized.indexOf("。");
  let excerpt =
    periodIndex === -1 ? normalized : normalized.slice(0, periodIndex + 1);

  if (excerpt.length > SOCIAL_POST_BODY_MAX_CHARS) {
    excerpt = `${excerpt.slice(0, SOCIAL_POST_BODY_MAX_CHARS - 1)}…`;
  }
  return excerpt;
}

/** 鑑定士のひとこと：最初の「。」まで、または文字数上限。 */
export function extractSocialPostCommentText(comment: string): string {
  const normalized = normalizeSocialPostText(comment.replace(/\n+/g, " "));
  if (!normalized) return "";

  const periodIndex = normalized.indexOf("。");
  let excerpt =
    periodIndex !== -1 ? normalized.slice(0, periodIndex + 1) : normalized;

  if (excerpt.length > SOCIAL_POST_COMMENT_MAX_CHARS) {
    excerpt = `${excerpt.slice(0, SOCIAL_POST_COMMENT_MAX_CHARS - 1)}…`;
  }
  return excerpt;
}
