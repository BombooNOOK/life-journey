"use client";

import { useCallback, useRef, useState } from "react";

type PhotoApiResponse = {
  entryId?: string;
  photoDataUrl?: string | null;
  error?: string;
};

/**
 * 日記ブック閲覧用: entryId ごとに写真 data URL を遅延取得し、セッション内で再利用する。
 */
export function useDiaryBookEntryPhotos() {
  const cacheRef = useRef<Map<string, string>>(new Map());
  const inflightRef = useRef<Set<string>>(new Set());
  const noPhotoRef = useRef<Set<string>>(new Set());
  const [cacheTick, setCacheTick] = useState(0);

  const bump = useCallback(() => setCacheTick((n) => n + 1), []);

  const fetchPhoto = useCallback(
    async (entryId: string) => {
      if (
        cacheRef.current.has(entryId) ||
        inflightRef.current.has(entryId) ||
        noPhotoRef.current.has(entryId)
      ) {
        return;
      }
      inflightRef.current.add(entryId);
      bump();
      try {
        const res = await fetch(`/api/journal/entries/${encodeURIComponent(entryId)}/photo`, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await res.json()) as PhotoApiResponse;
        if (!res.ok) return;
        const url = data.photoDataUrl?.trim() ?? "";
        if (url.length > 0) {
          cacheRef.current.set(entryId, url);
        } else {
          noPhotoRef.current.add(entryId);
        }
        bump();
      } finally {
        inflightRef.current.delete(entryId);
        bump();
      }
    },
    [bump],
  );

  const prefetchEntryIds = useCallback(
    (entryIds: Iterable<string>) => {
      for (const id of entryIds) {
        void fetchPhoto(id);
      }
    },
    [fetchPhoto],
  );

  const getPhotoDataUrl = useCallback(
    (entryId: string): string | null => {
      void cacheTick;
      return cacheRef.current.get(entryId) ?? null;
    },
    [cacheTick],
  );

  const isPhotoLoading = useCallback(
    (entryId: string, hasPhoto: boolean | undefined): boolean => {
      void cacheTick;
      if (!hasPhoto) return false;
      if (cacheRef.current.has(entryId) || noPhotoRef.current.has(entryId)) return false;
      return inflightRef.current.has(entryId);
    },
    [cacheTick],
  );

  const shouldShowPhotoLoading = useCallback(
    (entryId: string, hasPhoto: boolean | undefined): boolean => {
      void cacheTick;
      if (!hasPhoto) return false;
      if (cacheRef.current.has(entryId)) return false;
      return !noPhotoRef.current.has(entryId);
    },
    [cacheTick],
  );

  const resetCache = useCallback(() => {
    cacheRef.current.clear();
    inflightRef.current.clear();
    noPhotoRef.current.clear();
    bump();
  }, [bump]);

  return {
    cacheVersion: cacheTick,
    getPhotoDataUrl,
    isPhotoLoading,
    shouldShowPhotoLoading,
    prefetchEntryIds,
    resetCache,
  };
}
