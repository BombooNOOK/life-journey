"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import {
  normalizeReadingFontSize,
  readingFontSizeToDataAttribute,
  resolveInitialReadingFontSize,
  type ReadingFontSize,
} from "@/lib/reading/readingFontSize";
import { preserveScrollPosition } from "@/lib/reading/preserveScrollPosition";
import {
  readReadingFontSizeFromStorage,
  writeReadingFontSizeToStorage,
} from "@/lib/reading/readingFontSizeStorage";

type ReadingFontSizeContextValue = {
  readingFontSize: ReadingFontSize;
  setReadingFontSize: (size: ReadingFontSize, options?: SetReadingFontSizeOptions) => void;
  ready: boolean;
};

export type SetReadingFontSizeOptions = {
  /** 文字サイズ変更後も画面上の位置を保つ基準要素 */
  scrollAnchor?: HTMLElement | null;
};

const ReadingFontSizeContext = createContext<ReadingFontSizeContextValue | null>(null);

function applyReadingFontSizeToDocument(size: ReadingFontSize) {
  document.documentElement.dataset.readingFontSize = readingFontSizeToDataAttribute(size);
}

async function fetchServerReadingFontSize(): Promise<ReadingFontSize | null> {
  const res = await fetch("/api/account/reading-font-size", {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { readingFontSize?: unknown };
  return normalizeReadingFontSize(data.readingFontSize);
}

async function persistServerReadingFontSize(size: ReadingFontSize): Promise<void> {
  await fetch("/api/account/reading-font-size", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ readingFontSize: size }),
  });
}

export function ReadingFontSizeProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [readingFontSize, setReadingFontSizeState] = useState<ReadingFontSize>(
    resolveInitialReadingFontSize(readReadingFontSizeFromStorage()),
  );
  const [ready, setReady] = useState(false);
  const hydratedRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);

  useEffect(() => {
    applyReadingFontSizeToDocument(readingFontSize);
  }, [readingFontSize]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    void (async () => {
      const local = readReadingFontSizeFromStorage();
      if (local && !hydratedRef.current) {
        setReadingFontSizeState(local);
        applyReadingFontSizeToDocument(local);
      }

      if (user?.email) {
        try {
          const serverSize = await fetchServerReadingFontSize();
          if (!cancelled && serverSize) {
            setReadingFontSizeState(serverSize);
            writeReadingFontSizeToStorage(serverSize);
          }
        } catch {
          /* offline */
        }
      }

      if (!cancelled) {
        hydratedRef.current = true;
        setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.email]);

  const setReadingFontSize = useCallback(
    (size: ReadingFontSize, options?: SetReadingFontSizeOptions) => {
      const apply = () => {
        setReadingFontSizeState(size);
        writeReadingFontSizeToStorage(size);
        applyReadingFontSizeToDocument(size);
      };

      const anchor = options?.scrollAnchor;
      if (anchor) {
        preserveScrollPosition(anchor, apply);
      } else {
        apply();
      }

      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
      persistTimerRef.current = window.setTimeout(() => {
        persistTimerRef.current = null;
        if (!user?.email) return;
        void persistServerReadingFontSize(size).catch(() => {
          /* best effort */
        });
      }, 300);
    },
    [user?.email],
  );

  useEffect(
    () => () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
    },
    [],
  );

  const value = useMemo(
    () => ({ readingFontSize, setReadingFontSize, ready }),
    [readingFontSize, setReadingFontSize, ready],
  );

  return (
    <ReadingFontSizeContext.Provider value={value}>{children}</ReadingFontSizeContext.Provider>
  );
}

export function useReadingFontSize(): ReadingFontSizeContextValue {
  const ctx = useContext(ReadingFontSizeContext);
  if (!ctx) {
    throw new Error("useReadingFontSize must be used within ReadingFontSizeProvider");
  }
  return ctx;
}
