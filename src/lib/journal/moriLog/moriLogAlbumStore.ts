import {
  createMoriLogAlbumId,
  type MoriLogAlbum,
  type MoriLogAlbumCreateInput,
} from "@/lib/journal/moriLog/moriLogAlbum";

export type MoriLogAlbumStore = {
  list(profileId: string): Promise<MoriLogAlbum[]>;
  get(id: string, profileId: string): Promise<MoriLogAlbum | null>;
  upsert(input: MoriLogAlbumCreateInput): Promise<MoriLogAlbum>;
  remove(id: string, profileId: string): Promise<void>;
};

const STORAGE_PREFIX = "ljd.moriLogAlbum.v1:";

function getLocalStorage(): Storage | null {
  try {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    if (!storage) return null;
    storage.getItem(STORAGE_PREFIX);
    return storage;
  } catch {
    return null;
  }
}

const memoryByProfile = new Map<string, MoriLogAlbum[]>();

function storageKey(profileId: string): string {
  return `${STORAGE_PREFIX}${profileId || "_"}`;
}

function isAlbumShape(value: unknown): value is MoriLogAlbum {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.profileId === "string" &&
    typeof v.title === "string" &&
    Array.isArray(v.mediaIds) &&
    v.mediaIds.every((id) => typeof id === "string") &&
    typeof v.coverMediaId === "string" &&
    (v.coverType === "card_image" || v.coverType === "card_movie") &&
    typeof v.createdAt === "string" &&
    typeof v.updatedAt === "string"
  );
}

function readAll(profileId: string): MoriLogAlbum[] {
  const storage = getLocalStorage();
  if (!storage) {
    return [...(memoryByProfile.get(profileId) ?? [])];
  }
  try {
    const raw = storage.getItem(storageKey(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAlbumShape);
  } catch {
    return [];
  }
}

function writeAll(profileId: string, items: MoriLogAlbum[]): void {
  const storage = getLocalStorage();
  if (!storage) {
    memoryByProfile.set(profileId, items);
    return;
  }
  storage.setItem(storageKey(profileId), JSON.stringify(items));
}

export function createLocalMoriLogAlbumStore(): MoriLogAlbumStore {
  return {
    async list(profileId) {
      return readAll(profileId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async get(id, profileId) {
      return readAll(profileId).find((item) => item.id === id) ?? null;
    },
    async upsert(input) {
      const profileId = input.profileId;
      const now = new Date().toISOString();
      const id = input.id ?? createMoriLogAlbumId();
      const existing = readAll(profileId).find((item) => item.id === id);
      const next: MoriLogAlbum = {
        id,
        profileId,
        title: input.title.trim() || existing?.title || "無題のアルバム",
        mediaIds: [...input.mediaIds],
        coverMediaId: input.coverMediaId,
        coverType: input.coverType,
        createdAt: input.createdAt ?? existing?.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
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

let singleton: MoriLogAlbumStore | null = null;

export function getMoriLogAlbumStore(): MoriLogAlbumStore {
  if (!singleton) {
    singleton = createLocalMoriLogAlbumStore();
  }
  return singleton;
}

/** テスト用 */
export function resetMoriLogAlbumStoreForTests(): void {
  singleton = null;
  memoryByProfile.clear();
}
