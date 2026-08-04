/**
 * ひとやすみの椅子 — 端末内森ログの見返し（軽量版）
 */

import {
  isMoriLogCardImageType,
  isMoriLogCardMovieType,
  type MoriLogMedia,
  type MoriLogMediaType,
} from "@/lib/journal/moriLog/moriLogMedia";
import { getMoriLogMediaStore } from "@/lib/journal/moriLog/moriLogMediaStore";
import { isMoriAshiatoTemplateId, MORI_ASHIATO_TEMPLATES } from "@/lib/journal/social-post-image/moriAshiatoTemplates";

export type HitoyasumiMediaFilter = "all" | "card_image" | "card_movie";

/** 椅子で扱う種類（video_memory は将来） */
export function isHitoyasumiBrowsableType(type: MoriLogMediaType): boolean {
  return isMoriLogCardImageType(type) || isMoriLogCardMovieType(type);
}

export function filterHitoyasumiMedia(
  items: readonly MoriLogMedia[],
  filter: HitoyasumiMediaFilter,
): MoriLogMedia[] {
  return items.filter((item) => {
    if (!isHitoyasumiBrowsableType(item.type)) return false;
    if (filter === "all") return true;
    return item.type === filter;
  });
}

/** あしあと日付キー（YYYY-MM-DD）から年月を取る */
export function parseHitoyasumiEntryDateKey(
  entryDateKey: string,
): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec((entryDateKey || "").trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

/** 一覧にあるあしあと年（新しい年→古い年） */
export function collectHitoyasumiYears(items: readonly MoriLogMedia[]): number[] {
  const years = new Set<number>();
  for (const item of items) {
    if (!isHitoyasumiBrowsableType(item.type)) continue;
    const parsed = parseHitoyasumiEntryDateKey(item.entryDateKey);
    if (!parsed) continue;
    years.add(parsed.year);
  }
  return [...years].sort((a, b) => b - a);
}

/**
 * あしあと日付の年・月で絞り込み。
 * year 未指定なら全件。year のみならその年すべて。year+month ならその月。
 */
export function filterHitoyasumiMediaByYearMonth(
  items: readonly MoriLogMedia[],
  year: number | null,
  month: number | null,
): MoriLogMedia[] {
  if (year == null) return [...items];
  return items.filter((item) => {
    const parsed = parseHitoyasumiEntryDateKey(item.entryDateKey);
    if (!parsed) return false;
    if (parsed.year !== year) return false;
    if (month != null && parsed.month !== month) return false;
    return true;
  });
}

/** 一覧・アルバム作成で使えるタグ候補（# なしで正規化） */
export function collectHitoyasumiTags(items: readonly MoriLogMedia[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    for (const raw of item.tags ?? []) {
      const tag = raw.replace(/^#/, "").trim();
      if (!tag || seen.has(tag)) continue;
      seen.add(tag);
      out.push(tag);
    }
  }
  return out.sort((a, b) => a.localeCompare(b, "ja"));
}

/** 選んだタグのいずれかを持つもの（OR）。未選択なら全件 */
export function filterHitoyasumiMediaByTags(
  items: readonly MoriLogMedia[],
  selectedTags: readonly string[],
): MoriLogMedia[] {
  const needles = selectedTags
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
  if (needles.length === 0) return [...items];
  const set = new Set(needles);
  return items.filter((item) =>
    (item.tags ?? []).some((raw) => set.has(raw.replace(/^#/, "").trim())),
  );
}

export async function listHitoyasumiMedia(profileId: string): Promise<MoriLogMedia[]> {
  const pid = profileId.trim();
  if (!pid) return [];
  const items = await getMoriLogMediaStore().list({ profileId: pid });
  return items.filter((item) => isHitoyasumiBrowsableType(item.type));
}

export function hitoyasumiMediaTypeLabel(type: MoriLogMediaType): string {
  if (type === "card_movie") return "ムービー";
  if (type === "card_image") return "カード";
  return "その他";
}

export function hitoyasumiTemplateLabel(templateId: string): string {
  if (isMoriAshiatoTemplateId(templateId)) {
    return MORI_ASHIATO_TEMPLATES[templateId].label;
  }
  if (templateId === "sns02") return "ひだまりフォト（横長）";
  if (templateId === "sns03") return "森のスクラップ（スクエア）";
  return templateId;
}

export function formatHitoyasumiCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}
