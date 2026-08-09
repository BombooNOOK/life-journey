"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH } from "@/lib/forestResident/forestResidentDisplayName";

type Props = {
  initialDisplayName: string;
};

/** ログハウス：住民票のおなまえ編集 */
export function ForestResidentDisplayNameEditor({ initialDisplayName }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [savedDisplayName, setSavedDisplayName] = useState(initialDisplayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(initialDisplayName);
    setSavedDisplayName(initialDisplayName);
  }, [initialDisplayName]);

  const trimmed = displayName.trim();
  const unchanged = trimmed === savedDisplayName;

  async function saveDisplayName() {
    setError(null);
    setSavedMessage(null);
    if (!trimmed) {
      setError("おなまえを入力してください。");
      return;
    }
    if (trimmed.length > FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH) {
      setError(`おなまえは${FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください。`);
      return;
    }
    if (unchanged) return;

    setBusy(true);
    try {
      const res = await fetch("/api/viewer/forest-resident-card", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ displayName: trimmed }),
      });
      const data = (await res.json()) as {
        error?: string;
        card?: { displayName: string };
      };
      if (!res.ok || !data.card) {
        setError(data.error ?? "おなまえの変更に失敗しました。");
        return;
      }
      setSavedDisplayName(data.card.displayName);
      setDisplayName(data.card.displayName);
      setSavedMessage("住民票のおなまえを変更しました。");
      router.refresh();
    } catch {
      setError("おなまえの変更に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-medium text-stone-700" htmlFor="forest-resident-display-name">
        住民票のおなまえ
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id="forest-resident-display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={busy}
          maxLength={FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 disabled:opacity-60 sm:max-w-[14rem]"
        />
        <button
          type="button"
          disabled={busy || unchanged || !trimmed}
          onClick={() => void saveDisplayName()}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {busy ? <OwlLoadingInline label="保存中…" size="sm" /> : "変更を保存"}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-stone-500">
        {FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH}文字以内。森の住民票に載るおなまえです。
      </p>
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {savedMessage ? (
        <p className="text-xs text-emerald-800" role="status">
          {savedMessage}
        </p>
      ) : null}
    </div>
  );
}
