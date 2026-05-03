"use client";

import { useEffect, useState } from "react";

type ProfileRow = { id: string; nickname: string };

type Props = {
  profileIdFromQuery: string;
};

export function OrderFormProfileNotice({ profileIdFromQuery }: Props) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!profileIdFromQuery) {
      setLabel(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profiles", { method: "GET" });
        if (!res.ok) return;
        const data = (await res.json()) as { profiles?: ProfileRow[] };
        const list = data.profiles ?? [];
        const match = list.find((p) => p.id === profileIdFromQuery);
        if (!cancelled) setLabel(match?.nickname ?? "このプロフィール");
      } catch {
        if (!cancelled) setLabel("このプロフィール");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileIdFromQuery]);

  if (!profileIdFromQuery) return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
      <p className="font-medium">
        保存先: {label ? `「${label}」` : "…"} プロフィール
      </p>
      <p className="mt-1 text-xs text-emerald-900/80">
        マイページの切り替えと同じ保存先に入ります。別の人向けの鑑定は、先にプロフィールを切り替えてから始めてください。
      </p>
    </div>
  );
}
