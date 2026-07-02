"use client";

import type { CompanionType } from "@/lib/journal/meta";
import type { JournalCompanionHandoffFocus } from "@/lib/journal/companionWriting/session";
import { getCompanionWritingEditGuideWhisper } from "@/lib/journal/companionWriting/guideWhispers";
import { COMPANION_WRITING_EDIT_FINISH_LABEL } from "@/lib/journal/companionWriting/types";
import { diaryBookEntryCompanionImagePath } from "@/lib/journal/diaryBookEntryAssets";

import {
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideSecondaryButtonClass,
} from "./companionWritingGuideStyles";

type Props = {
  companionType: CompanionType;
  activeFocus: JournalCompanionHandoffFocus | null;
  saving?: boolean;
  onFocusSection: (focus: JournalCompanionHandoffFocus) => void;
  onFinish: () => void;
};

/** 伴走編集：画面下に常駐するコンパクトガイド（両方いつでも選べる） */
export function CompanionWritingJournalGuideDock({
  companionType,
  activeFocus,
  saving = false,
  onFocusSection,
  onFinish,
}: Props) {
  const whisper = getCompanionWritingEditGuideWhisper(companionType);
  const companionImagePath = diaryBookEntryCompanionImagePath(companionType);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/90 bg-[#fffbf5]/96 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_36px_rgba(80,62,44,0.14)] backdrop-blur-sm"
      role="complementary"
      aria-label="今日のページを育てる案内"
    >
      <div className="mx-auto max-w-lg space-y-2.5">
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100/80 bg-emerald-50/50 px-2.5 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={companionImagePath}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain object-bottom"
          />
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-stone-700">
            <span className="font-semibold text-stone-800">{whisper.name}：</span>
            {whisper.message}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => onFocusSection("photo")}
            className={[
              companionWritingGuideSecondaryButtonClass,
              "min-h-[40px] flex-1 py-2 text-xs sm:text-sm",
              activeFocus === "photo" ? "ring-2 ring-emerald-300/80" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            写真を残す
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onFocusSection("body")}
            className={[
              companionWritingGuideSecondaryButtonClass,
              "min-h-[40px] flex-1 py-2 text-xs sm:text-sm",
              activeFocus === "body" ? "ring-2 ring-emerald-300/80" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            ことばを足す
          </button>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={onFinish}
          className={companionWritingGuidePrimaryButtonClass}
        >
          {saving ? "保存中…" : COMPANION_WRITING_EDIT_FINISH_LABEL}
        </button>
      </div>
    </div>
  );
}
