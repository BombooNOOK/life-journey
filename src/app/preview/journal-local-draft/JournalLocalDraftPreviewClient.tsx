"use client";

import { useState } from "react";
import Link from "next/link";

import {
  JournalLocalDraftBanner,
  JOURNAL_LOCAL_DRAFT_PHOTO_NOTICE,
} from "@/components/journal/JournalLocalDraftBanner";

type ScenarioId = "online-idle" | "offline" | "offline-with-draft" | "restore";

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: "online-idle", label: "オンライン（通常・表示なし）" },
  { id: "offline", label: "オフライン" },
  { id: "offline-with-draft", label: "オフライン＋端末限定注記" },
  { id: "restore", label: "復元確認（オンライン/オフライン共通）" },
];

export function JournalLocalDraftPreviewClient() {
  const [scenario, setScenario] = useState<ScenarioId>("restore");

  const isOffline = scenario === "offline" || scenario === "offline-with-draft" || scenario === "restore";
  const showDeviceOnlyNotice = scenario === "offline-with-draft";
  const restorePromptVisible = scenario === "restore";
  const showPhotoNotice = isOffline;

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
        <p className="font-medium text-stone-900">表示方針（調整後）</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-stone-600">
          <li>オンライン通常入力中: バナーは出さない（下書きは裏側のみ）</li>
          <li>オフライン時のみ: オフライン告知＋必要に応じて端末限定注記</li>
          <li>復元確認: オンライン/オフライン問わず、ユーザー確認あり</li>
          <li>保存成功後: 下書き削除は裏側のみ（メッセージなし・保存演出優先）</li>
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-800">表示パターンを切り替え</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {SCENARIOS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScenario(item.id)}
              className={[
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                scenario === item.id
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-stone-800">日記入力画面（バナー部分）</h2>
        {scenario === "online-idle" ? (
          <p className="mt-3 text-sm text-stone-500">
            （オンライン通常時は、ここにバナーは表示されません）
          </p>
        ) : (
          <div className="mt-4">
            <JournalLocalDraftBanner
              showDeviceOnlyNotice={showDeviceOnlyNotice}
              isOffline={isOffline && !restorePromptVisible}
              restorePromptVisible={restorePromptVisible}
              onRestore={() => setScenario("offline-with-draft")}
              onDiscardRestore={() => setScenario("online-idle")}
            />
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-stone-200 bg-[#faf8f5]/80 px-3 py-3">
            <p className="text-sm font-medium text-stone-800">今日の記録（ダミー）</p>
            <textarea
              readOnly
              className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
              rows={3}
              value="例）飛行機の中で書いたメモ。"
            />
          </div>

          <div className="rounded-lg border border-dashed border-stone-200/90 bg-[#faf8f5]/50 px-3 py-3">
            <p className="text-sm font-medium text-stone-700">この日の写真（任意）</p>
            {showPhotoNotice ? (
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                {JOURNAL_LOCAL_DRAFT_PHOTO_NOTICE}
              </p>
            ) : (
              <p className="mt-1 text-xs text-stone-400">（オンライン通常時は写真注記なし）</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-4">
        <h2 className="text-sm font-semibold text-violet-950">実際の動作確認（ログイン必要）</h2>
        <Link
          href="/login?returnTo=%2Fjournal"
          className="mt-3 inline-flex rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100"
        >
          ログインして /journal を開く →
        </Link>
      </section>
    </div>
  );
}
