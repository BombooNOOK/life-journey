"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

export type ViewerProfileOption = { id: string; nickname: string };

type Options = {
  /** URL の ?profile=（未指定なら searchParams から読む） */
  urlProfileId?: string;
  /** cookie の選択と URL を揃える（journal 入力など） */
  syncProfileToUrl?: boolean;
  /** プロフィールが1件もないときの遷移先 */
  redirectIfMissing?: string;
};

export function useEnsureActiveViewerProfile(options: Options = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProfileFromParams = (options.urlProfileId ?? searchParams.get("profile") ?? "").trim();
  const [profiles, setProfiles] = useState<ViewerProfileOption[]>([]);
  const [cookieProfileId, setCookieProfileId] = useState("");
  const [ready, setReady] = useState(false);
  const syncedCookieRef = useRef<string | null>(null);
  const syncedUrlRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    void fetch("/api/profiles", { credentials: "same-origin", cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as {
          profiles?: ViewerProfileOption[];
          activeProfileId?: string;
        };
        if (!res.ok || cancelled) return;
        setProfiles(data.profiles ?? []);
        setCookieProfileId(String(data.activeProfileId ?? "").trim());
      })
      .catch(() => {
        if (!cancelled) {
          setProfiles([]);
          setCookieProfileId("");
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveProfileId = useMemo(() => {
    if (urlProfileFromParams && profiles.some((p) => p.id === urlProfileFromParams)) {
      return urlProfileFromParams;
    }
    if (cookieProfileId && profiles.some((p) => p.id === cookieProfileId)) {
      return cookieProfileId;
    }
    return profiles[0]?.id ?? "";
  }, [urlProfileFromParams, cookieProfileId, profiles]);

  const activeProfileNickname = useMemo(() => {
    return profiles.find((p) => p.id === effectiveProfileId)?.nickname ?? "メイン";
  }, [profiles, effectiveProfileId]);

  useEffect(() => {
    if (!ready) return;
    if (profiles.length === 0) {
      if (options.redirectIfMissing) {
        router.replace(options.redirectIfMissing);
      }
      return;
    }
    if (!effectiveProfileId) return;

    if (urlProfileFromParams && urlProfileFromParams === effectiveProfileId) {
      if (syncedCookieRef.current !== effectiveProfileId) {
        syncedCookieRef.current = effectiveProfileId;
        if (cookieProfileId !== effectiveProfileId) {
          void selectViewerProfile(effectiveProfileId).then((result) => {
            if (result.ok) setCookieProfileId(effectiveProfileId);
          });
        }
      }
    }

    if (options.syncProfileToUrl && !urlProfileFromParams && !syncedUrlRef.current) {
      syncedUrlRef.current = true;
      const next = new URLSearchParams(searchParams.toString());
      next.set("profile", effectiveProfileId);
      router.replace(`?${next.toString()}`, { scroll: false });
    }
  }, [
    ready,
    profiles.length,
    effectiveProfileId,
    urlProfileFromParams,
    cookieProfileId,
    options.syncProfileToUrl,
    options.redirectIfMissing,
    router,
    searchParams,
  ]);

  return {
    ready,
    profiles,
    effectiveProfileId,
    activeProfileNickname,
    hasProfiles: profiles.length > 0,
  };
}
