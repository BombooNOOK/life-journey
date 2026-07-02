"use client";

import type { CompanionType } from "@/lib/journal/meta";
import type { JournalCompanionHandoffFocus } from "@/lib/journal/companionWriting/session";
import { scrollJournalEditSectionIntoView } from "@/lib/journal/companionWriting/editSectionScroll";
import { getCompanionWritingEditGuideWhisper } from "@/lib/journal/companionWriting/guideWhispers";
import { COMPANION_WRITING_JOURNAL_GUIDE_TITLE } from "@/lib/journal/companionWriting/types";
import { diaryBookEntryCompanionImagePath } from "@/lib/journal/diaryBookEntryAssets";

import { CompanionWritingGuideCardShell } from "./CompanionWritingGuideCardShell";
import { CompanionWritingGuideStage } from "./CompanionWritingGuideStage";
import { companionWritingGuideSecondaryButtonClass } from "./companionWritingGuideStyles";

type Props = {
  companionType: CompanionType;
  emphasis: JournalCompanionHandoffFocus | "both";
  onDismiss: () => void;
};

/** 伴走導線から編集画面へ来たときだけ：保存ギミック型の浮きガイド（1段） */
export function CompanionWritingJournalGuide({ companionType, emphasis, onDismiss }: Props) {
  const photoEmphasis = emphasis === "photo";
  const bodyEmphasis = emphasis === "body";
  const whisper = getCompanionWritingEditGuideWhisper(companionType);
  const companionImagePath = diaryBookEntryCompanionImagePath(companionType);

  const focusSection = (focus: JournalCompanionHandoffFocus) => {
    onDismiss();
    scrollJournalEditSectionIntoView(focus);
  };

  return (
    <CompanionWritingGuideStage ariaLabel={COMPANION_WRITING_JOURNAL_GUIDE_TITLE}>
      <CompanionWritingGuideCardShell>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => focusSection("photo")}
            className={[
              companionWritingGuideSecondaryButtonClass,
              photoEmphasis ? "ring-2 ring-emerald-200/70" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            写真を残す
          </button>
          <button
            type="button"
            onClick={() => focusSection("body")}
            className={[
              companionWritingGuideSecondaryButtonClass,
              bodyEmphasis ? "ring-2 ring-emerald-200/70" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            ことばを足す
          </button>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-stone-800">鑑定士からのメッセージ</p>
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100/90 bg-emerald-50/40 px-3 py-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={companionImagePath}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 object-contain object-bottom"
            />
            <div className="min-w-0 text-sm leading-relaxed text-stone-800">
              <p>{whisper.message}</p>
              <p className="mt-1 text-xs font-semibold text-stone-600">{whisper.name}より</p>
            </div>
            </div>
          </div>
        </div>
      </CompanionWritingGuideCardShell>
    </CompanionWritingGuideStage>
  );
}
