import {
  createMoriLogMediaId,
  normalizeMoriLogMediaType,
  type MoriLogMedia,
  type MoriLogMediaCreateInput,
  type MoriLogMediaType,
} from "@/lib/journal/moriLog/moriLogMedia";

export type MoriLogMediaListFilter = {
  profileId: string;
  entryId?: string;
  type?: MoriLogMediaType;
  /** YYYY-MM */
  monthKey?: string;
  tag?: string;
  /** YYYY-MM-DD（去年の今日など） */
  entryDateKey?: string;
};

/**
 * 森ログ履歴ストア。
 * Phase 0: ローカル実装。将来 Neon / ネイティブに差し替え可能。
 */
export type MoriLogMediaStore = {
  list(filter: MoriLogMediaListFilter): Promise<MoriLogMedia[]>;
  get(id: string, profileId: string): Promise<MoriLogMedia | null>;
  upsert(input: MoriLogMediaCreateInput): Promise<MoriLogMedia>;
  remove(id: string, profileId: string): Promise<void>;
};

const STORAGE_PREFIX = "ljd.moriLogMedia.v1:";

/** SSR / テストでも localStorage があれば使う */
function getLocalStorage(): Storage | null {
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    if (!storage) return null;
    // Access may throw in some private modes
    storage.getItem(STORAGE_PREFIX);
    return storage;
  } catch {
    return null;
  }
}

const memoryByProfile = new Map<string, MoriLogMedia[]>();

function storageKey(profileId: string): string {
  return `${STORAGE_PREFIX}${profileId || "_"}`;
}

function isMoriLogMediaRawShape(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.profileId === "string" &&
    typeof v.entryId === "string" &&
    normalizeMoriLogMediaType(v.type) != null &&
    typeof v.templateId === "string" &&
    typeof v.entryDateKey === "string" &&
    Array.isArray(v.tags) &&
    Array.isArray(v.hashtags) &&
    typeof v.createdAt === "string"
  );
}

/**
 * 生 JSON → 現行 MoriLogMedia。
 * 旧 type（card / movie）はここで正規化する。
 */
export function normalizeMoriLogMediaRecord(value: unknown): MoriLogMedia | null {
  if (!isMoriLogMediaRawShape(value)) return null;
  const type = normalizeMoriLogMediaType(value.type);
  if (!type) return null;
  return {
    ...(value as unknown as MoriLogMedia),
    type,
  };
}

function readAll(profileId: string): MoriLogMedia[] {
  const storage = getLocalStorage();
  if (!storage) {
    return [...(memoryByProfile.get(profileId) ?? [])];
  }
  try {
    const raw = storage.getItem(storageKey(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    let migrated = false;
    const items: MoriLogMedia[] = [];
    for (const entry of parsed) {
      const beforeType =
        entry && typeof entry === "object"
          ? (entry as { type?: unknown }).type
          : undefined;
      const next = normalizeMoriLogMediaRecord(entry);
      if (!next) continue;
      if (beforeType !== next.type) migrated = true;
      items.push(next);
    }

    // 旧 type を現行に書き戻し、次回以降の読み取りを安定させる
    if (migrated) {
      writeAll(profileId, items);
    }
    return items;
  } catch {
    return [];
  }
}

function writeAll(profileId: string, items: MoriLogMedia[]): void {
  const storage = getLocalStorage();
  if (!storage) {
    memoryByProfile.set(profileId, items);
    return;
  }
  storage.setItem(storageKey(profileId), JSON.stringify(items));
}

function matchesFilter(item: MoriLogMedia, filter: MoriLogMediaListFilter): boolean {
  if (item.profileId !== filter.profileId) return false;
  if (filter.entryId && item.entryId !== filter.entryId) return false;
  if (filter.type && item.type !== filter.type) return false;
  if (filter.entryDateKey && item.entryDateKey !== filter.entryDateKey) return false;
  if (filter.monthKey && !item.entryDateKey.startsWith(filter.monthKey)) return false;
  if (filter.tag) {
    const needle = filter.tag.replace(/^#/, "").trim();
    if (!needle) return true;
    if (!item.tags.some((t) => t === needle || t === `#${needle}`)) return false;
  }
  return true;
}

export function createLocalMoriLogMediaStore(): MoriLogMediaStore {
  return {
    async list(filter) {
      return readAll(filter.profileId)
        .filter((item) => matchesFilter(item, filter))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async get(id, profileId) {
      return readAll(profileId).find((item) => item.id === id) ?? null;
    },
    async upsert(input) {
      const profileId = input.profileId;
      const now = input.createdAt ?? new Date().toISOString();
      const id = input.id ?? createMoriLogMediaId();
      const type = normalizeMoriLogMediaType(input.type) ?? input.type;
      const next: MoriLogMedia = {
        ...input,
        id,
        type,
        createdAt: now,
        tags: [...input.tags],
        hashtags: [...input.hashtags],
        sourceCardId: input.sourceCardId ?? null,
        bgmId: input.bgmId ?? null,
        durationSec: input.durationSec ?? null,
        mood: input.mood ?? null,
        companionType: input.companionType ?? null,
        title: input.title ?? null,
        captionText: input.captionText ?? null,
        localUri: input.localUri ?? null,
        remoteUrl: input.remoteUrl ?? null,
        contentHash: input.contentHash ?? null,
        sourcePackId: input.sourcePackId ?? null,
      };
      const items = readAll(profileId);
      const index = items.findIndex((item) => item.id === id);
      if (index >= 0) {
        items[index] = next;
      } else {
        items.unshift(next);
      }
      writeAll(profileId, items);
      return next;
    },
    async remove(id, profileId) {
      writeAll(
        profileId,
        readAll(profileId).filter((item) => item.id !== id),
      );
    },
  };
}

let singleton: MoriLogMediaStore | null = null;

/** ブラウザ用デフォルト（ローカル）。SSR では list が空。 */
export function getMoriLogMediaStore(): MoriLogMediaStore {
  if (!singleton) {
    singleton = createLocalMoriLogMediaStore();
  }
  return singleton;
}

/** テスト用 */
export function resetMoriLogMediaStoreForTests(): void {
  singleton = null;
  memoryByProfile.clear();
}
