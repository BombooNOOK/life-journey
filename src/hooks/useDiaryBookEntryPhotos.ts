"use client";

import { useCallback, useRef, useState } from "react";

import { journalEntryPhotoApiPath } from "@/lib/journal/journalEntryPhotoPath";

/**
 * あしあとブック閲覧用: 写真は認証付き photo API の URL を img src に使う（Blob / legacy 両対応）。
 */
export function useDiaryBookEntryPhotos() {
  const cacheRef = useRef<Map<string, string>>(new Map());
  const noPhotoRef = useRef<Set<string>>(new Set());
  const [cacheTick, setCacheTick] = useState(0);

  const bump = useCallback(() => setCacheTick((n) => n + 1), []);

  const registerPhoto = useCallback(
    (entryId: string, hasPhoto: boolean | undefined) => {
      if (!hasPhoto) {
        noPhotoRef.current.add(entryId);
        cacheRef.current.delete(entryId);
      } else {
        noPhotoRef.current.delete(entryId);
        cacheRef.current.set(entryId, journalEntryPhotoApiPath(entryId));
      }
      bump();
    },
    [bump],
  );

  const prefetchEntryIds = useCallback(
    (entries: Iterable<{ id: string; hasPhoto?: boolean }>) => {
      for (const e of entries) {
        registerPhoto(e.id, e.hasPhoto);
      }
    },
    [registerPhoto],
  );

  const getPhotoDataUrl = useCallback(
    (entryId: string): string | null => {
      void cacheTick;
      return cacheRef.current.get(entryId) ?? null;
    },
    [cacheTick],
  );

  const isPhotoLoading = useCallback(
    (_entryId: string, hasPhoto: boolean | undefined): boolean => {
      void cacheTick;
      return hasPhoto === true && !cacheRef.current.has(_entryId) && !noPhotoRef.current.has(_entryId);
    },
    [cacheTick],
  );

  const shouldShowPhotoLoading = useCallback(
    (entryId: string, hasPhoto: boolean | undefined): boolean => {
      void cacheTick;
      if (!hasPhoto) return false;
      return !cacheRef.current.has(entryId) && !noPhotoRef.current.has(entryId);
    },
    [cacheTick],
  );

  const resetCache = useCallback(() => {
    cacheRef.current.clear();
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
