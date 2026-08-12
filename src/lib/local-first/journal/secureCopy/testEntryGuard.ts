import { TEST_PURPOSE_TAGS } from "@/lib/local-first/journal/secureCopy/types";

export function normalizeTag(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return t.startsWith("#") ? t : `#${t}`;
}

export function hasTestPurposeTag(tags: string[]): boolean {
  const set = new Set(tags.map(normalizeTag).filter(Boolean));
  return TEST_PURPOSE_TAGS.some((marker) => set.has(marker));
}

export function parseExplicitEntryIds(raw: string | string[]): string[] {
  const parts = Array.isArray(raw)
    ? raw
    : raw.split(/[\s,;]+/g);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const id = part.trim();
    if (!id) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
