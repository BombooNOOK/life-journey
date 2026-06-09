"use client";

import { useEffect, useState } from "react";

import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";

type EntitlementResponse = {
  entitlement?: SerializedUserEntitlement;
  error?: string;
  code?: string;
};

export function useEntitlement() {
  const [entitlement, setEntitlement] = useState<SerializedUserEntitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/entitlement", { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => {
        const data = (await res.json()) as EntitlementResponse;
        if (!res.ok || !data.entitlement) {
          throw new Error(data.error ?? "利用状況を確認できませんでした。");
        }
        if (!cancelled) {
          setEntitlement(data.entitlement);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "利用状況を確認できませんでした。");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { entitlement, loading, error };
}
