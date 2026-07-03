/** 日記本文末尾のタグ行（DBなし・content 内保存） */

const FULLWIDTH_HASH = "\uFF03";

/** タグ名に使えない文字（句読点など） */
const DIARY_TAG_FORBIDDEN_CHARS = /[\s#。、！？!?,，．.]/;

/** 1トークンが #タグ名 形式か（文中 # は false） */
function isDiaryTagToken(token: string): boolean {
  if (!token.startsWith("#")) return false;
  const name = token.slice(1);
  if (!name || DIARY_TAG_FORBIDDEN_CHARS.test(name)) return false;
  return true;
}

/** 行全体が #タグ の並びだけか（通常文・文中 # は除外） */
function isTagOnlyLine(line: string): boolean {
  const trimmed = normalizeDiaryHashChars(line.trim());
  if (!trimmed) return false;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(isDiaryTagToken);
}

/** タグ入力文字列をパースし、# なしのタグ名配列を返す（重複除去・出現順維持） */
export function parseDiaryTagInput(input: string): string[] {
  const normalized = normalizeDiaryHashChars(input.trim());
  if (!normalized) return [];

  const tags: string[] = [];
  const seen = new Set<string>();

  for (const token of normalized.split(/\s+/)) {
    if (!token) continue;
    const name = (token.startsWith("#") ? token.slice(1) : token).trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(name);
  }

  return tags;
}

/** 保存用タグ行（例: `#モグ #おでかけ`） */
export function formatDiaryTagsLine(tags: readonly string[]): string {
  const names = tags.flatMap((tag) =>
    parseDiaryTagInput(tag.includes("#") ? tag : `#${tag}`),
  );
  if (names.length === 0) return "";
  return names.map((name) => `#${name}`).join(" ");
}

/** UI のタグ欄表示用 */
export function formatDiaryTagsForInput(tags: readonly string[]): string {
  return formatDiaryTagsLine(tags);
}

/** 全角＃を半角 # に統一 */
export function normalizeDiaryHashChars(input: string): string {
  return input.replaceAll(FULLWIDTH_HASH, "#");
}

export type DiaryContentWithTags = {
  body: string;
  tags: string[];
};

/** 末尾のタグ行を剥がし、本文とタグに分離する */
export function extractTagsFromContent(content: string): DiaryContentWithTags {
  const normalized = normalizeDiaryHashChars(content)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  while (lines.length > 0 && lines[lines.length - 1]!.trim() === "") {
    lines.pop();
  }

  if (lines.length === 0) {
    return { body: "", tags: [] };
  }

  const lastLine = lines[lines.length - 1]!;
  if (!isTagOnlyLine(lastLine)) {
    return { body: normalized.trimEnd(), tags: [] };
  }

  lines.pop();
  while (lines.length > 0 && lines[lines.length - 1]!.trim() === "") {
    lines.pop();
  }

  return {
    body: lines.join("\n").trimEnd(),
    tags: parseDiaryTagInput(lastLine),
  };
}

/** @deprecated extractTagsFromContent を使用 */
export function parseTagsFromContent(content: string): string[] {
  return extractTagsFromContent(content).tags;
}

/** 表示・キーワード検索用：末尾タグ行を除いた本文 */
export function stripTagsFromContent(content: string): string {
  return extractTagsFromContent(content).body;
}

/** 本文とタグ入力を結合して保存用 content を作る */
export function mergeTagsIntoContent(body: string, tagInput: string): string {
  const trimmedBody = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd();
  const tagLine = formatDiaryTagsLine(parseDiaryTagInput(tagInput));

  if (!tagLine) {
    return trimmedBody;
  }
  if (!trimmedBody) {
    return tagLine;
  }
  return `${trimmedBody}\n\n${tagLine}`;
}

/** 末尾タグ行に query が含まれるか（タグ検索用） */
export function matchTag(content: string, tagQuery: string): boolean {
  const queryTags = parseDiaryTagInput(tagQuery);
  if (queryTags.length === 0) return true;

  const { tags } = extractTagsFromContent(content);
  const normalizedEntryTags = new Set(tags.map((tag) => tag.toLowerCase()));

  return queryTags.some((query) => normalizedEntryTags.has(query.toLowerCase()));
}

/** キーワード検索（本文全体・タグ行は対象外） */
export function matchesDiaryKeyword(content: string, keyword: string): boolean {
  const query = keyword.trim();
  if (!query) return true;
  return stripTagsFromContent(content).includes(query);
}

/** 複数日記から過去タグ一覧を抽出（出現順・重複除去） */
export function collectDiaryTagsFromContents(contents: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const content of contents) {
    const { tags } = extractTagsFromContent(content);
    for (const tag of tags) {
      const key = tag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(tag);
    }
  }

  return result.sort((a, b) => a.localeCompare(b, "ja"));
}
