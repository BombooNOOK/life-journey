"use client";

import Image from "next/image";
import Link from "next/link";

import { MoodOwlIcon } from "@/components/journal/MoodOwlIcon";
import { DiaryNumbersHintSection } from "@/components/journal/DiaryNumbersHintSection";
import { JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE } from "@/lib/journal/kanteiCommentCopy";
import { formatJournalPreviewDateHeading } from "@/lib/journal/journalRecordDateDisplay";
import { journalEditPath } from "@/lib/journal/journalNav";
import { getMoodMeta } from "@/lib/journal/meta";

type Props = {
  entryId: string;
  createdAt: string;
  content: string;
  mood: string;
  photoDataUrl?: string | null;
  photoSrc?: string | null;
  hasPhoto?: boolean;
  generatedComment: string | null;
  diaryNumbers?: {
    today: number;
    month: number;
    year: number;
    calmness: number;
  };
  kanteiOrderExists?: boolean;
  returnTo: string | null;
  profileId?: string | null;
  canEdit?: boolean;
};

function PencilEditLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 transition hover:bg-stone-50 active:bg-stone-100"
      aria-label={label}
      title={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </Link>
  );
}

export function JournalReadablePreview({
  entryId,
  createdAt,
  content,
  mood,
  photoDataUrl,
  photoSrc,
  hasPhoto,
  generatedComment,
  diaryNumbers,
  kanteiOrderExists,
  returnTo,
  profileId,
  canEdit = true,
}: Props) {
  const previewDate = new Date(createdAt);
  const dateLabel = formatJournalPreviewDateHeading(previewDate);
  const moodMeta = getMoodMeta(mood);
  const editHref = journalEditPath(
    entryId,
    returnTo ?? "/journal/preview",
    profileId ?? undefined,
  );
  const photoUrl =
    photoSrc?.trim() ||
    photoDataUrl?.trim() ||
    (hasPhoto ? `/api/journal/entries/${encodeURIComponent(entryId)}/photo` : "");
  const showPhoto = Boolean(photoUrl);
  const commentText =
    generatedComment?.trim() ||
    (kanteiOrderExists === false ? JOURNAL_OWL_COMMENT_KANTEI_REQUIRED_MESSAGE : null);

  return (
    <article className="space-y-6 rounded-xl bg-[#faf8f5] px-1 py-2 sm:bg-white sm:px-0 sm:py-0">
      <header className="flex items-start justify-between gap-3 border-b border-stone-200/80 pb-4">
        <h2 className="text-[1.375rem] font-bold leading-snug text-stone-900 sm:text-2xl">{dateLabel}</h2>
        {canEdit ? (
          <PencilEditLink href={editHref} label="この日記を編集する" />
        ) : null}
      </header>

      {showPhoto ? (
        <figure className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="relative aspect-square w-full max-h-[min(72vh,28rem)] sm:max-h-[32rem]">
            <Image
              src={photoUrl}
              alt={`${dateLabel}の写真`}
              fill
              className="object-contain bg-stone-100"
              sizes="(max-width: 640px) 100vw, 640px"
              unoptimized={photoUrl.startsWith("data:") || photoUrl.startsWith("/api/")}
            />
          </div>
        </figure>
      ) : null}

      <section className="rounded-xl border border-stone-200/90 bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5">
        <p className="whitespace-pre-wrap break-words text-[17px] leading-[1.65] text-stone-800">
          {content.trim() || "（本文なし）"}
        </p>
      </section>

      {commentText ? (
        <section className="rounded-xl border border-[#e8dfd0] bg-[#f7f1e6] px-4 py-4 shadow-sm sm:px-5 sm:py-5">
          <h3 className="text-base font-semibold text-stone-800">フクロウ先生より</h3>
          <p className="mt-3 whitespace-pre-wrap break-words text-[17px] leading-[1.65] text-stone-800">
            {commentText}
          </p>
        </section>
      ) : null}

      {diaryNumbers ? (
        <DiaryNumbersHintSection
          diaryNumbers={{
            today: diaryNumbers.today,
            month: diaryNumbers.month,
            year: diaryNumbers.year,
          }}
        />
      ) : null}

      <section className="rounded-xl border border-stone-200/80 bg-white/80 px-4 py-4">
        <h3 className="text-sm font-semibold text-stone-700">今日の気分</h3>
        <div className="mt-3 flex items-center gap-3">
          <MoodOwlIcon moodId={mood} sizePx={48} className="shrink-0" />
          <p className="text-base font-medium text-stone-800">{moodMeta.label}</p>
        </div>
      </section>
    </article>
  );
}
