import type { JournalPreviewNeighbors } from "@/lib/journal/journalPreviewNeighbors";

const PREFETCH_KEY_PREFIX = "journal-preview-prefetch:";
const PREFETCH_TTL_MS = 5 * 60 * 1000;

export type JournalPreviewPrefetchPayload = {
  entry: Record<string, unknown>;
  neighbors: JournalPreviewNeighbors;
  kanteiOrderExists?: boolean;
  fetchedAt: number;
};

function storageKey(entryId: string): string {
  return PREFETCH_KEY_PREFIX + entryId;
}

function parsePrefetch(raw: string | null): JournalPreviewPrefetchPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as JournalPreviewPrefetchPayload;
    if (!parsed?.entry || Date.now() - parsed.fetchedAt > PREFETCH_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeJournalPreviewPrefetch(
  entryId: string,
  payload: Omit<JournalPreviewPrefetchPayload, "fetchedAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      storageKey(entryId),
      JSON.stringify({ ...payload, fetchedAt: Date.now() }),
    );
  } catch {
    // sessionStorage 不可時はスキップ
  }
}

/** 先読み済みか確認（消費しない） */
export function peekJournalPreviewPrefetch(entryId: string): JournalPreviewPrefetchPayload | null {
  if (typeof window === "undefined") return null;
  return parsePrefetch(sessionStorage.getItem(storageKey(entryId)));
}

export function consumeJournalPreviewPrefetch(entryId: string): JournalPreviewPrefetchPayload | null {
  if (typeof window === "undefined") return null;
  const key = storageKey(entryId);
  const parsed = parsePrefetch(sessionStorage.getItem(key));
  if (parsed) sessionStorage.removeItem(key);
  return parsed;
}

export async function fetchJournalPreviewPayload(entryId: string): Promise<{
  entry: Record<string, unknown>;
  neighbors: JournalPreviewNeighbors;
  kanteiOrderExists?: boolean;
} | null> {
  const res = await fetch(`/api/journal/${encodeURIComponent(entryId)}`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = (await res.json()) as {
    entry?: Record<string, unknown>;
    neighbors?: JournalPreviewNeighbors;
    kanteiOrderExists?: boolean;
    error?: string;
  };
  if (!res.ok || !data.entry) return null;
  return {
    entry: data.entry,
    neighbors: data.neighbors ?? { prev: null, next: null },
    kanteiOrderExists: data.kanteiOrderExists,
  };
}

export async function prefetchJournalPreview(entryId: string): Promise<boolean> {
  const payload = await fetchJournalPreviewPayload(entryId);
  if (!payload) return false;
  storeJournalPreviewPrefetch(entryId, payload);
  return true;
}
