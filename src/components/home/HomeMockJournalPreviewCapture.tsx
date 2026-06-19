import { JournalReadablePreview } from "@/components/journal/JournalReadablePreview";
import { ActiveProfileLabel } from "@/components/profile/ActiveProfileLabel";

const DEMO_ENTRY_ID = "home-mock-preview-entry";
const DEMO_CREATED_AT = "2026-08-13T09:00:00.000Z";
const DEMO_CONTENT =
  "モゲが帰ってきて4ヶ月。今日はお部屋の掃除をしました。モゲはいつも通り、ケージの中で丸くなって寝ていました。そんな日常のひとコマです。";
const DEMO_DAY_HINT_REFLECTION = `この日の数字から見ると、

「今日は、やわらかい呼吸を大切にしたい日。」

というテーマがありました。

書き残したことの中に、
あとから気づける小さなヒントがあるかもしれません。`;
const DEMO_PHOTO_SRC = "/images/home-mock/demo-journal-photo.png";

export function HomeMockJournalPreviewCapture() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div>
          <h1 className="text-[1.375rem] font-bold text-stone-900 sm:text-[1.75rem]">日記プレビュー</h1>
          <ActiveProfileLabel nickname="メイン" className="mt-2" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-[44px] rounded-md border border-stone-700 bg-stone-800 px-3 py-2 text-base text-white"
          >
            読みやすく表示
          </button>
          <button
            type="button"
            className="min-h-[44px] rounded-md border border-stone-300 bg-white px-3 py-2 text-base text-stone-700"
          >
            製本イメージ
          </button>
        </div>
      </div>

      <JournalReadablePreview
        entryId={DEMO_ENTRY_ID}
        createdAt={DEMO_CREATED_AT}
        content={DEMO_CONTENT}
        mood="calm"
        photoSrc={DEMO_PHOTO_SRC}
        hasPhoto
        dayHintReflection={{ body: DEMO_DAY_HINT_REFLECTION }}
        kanteiOrderExists
        returnTo="/orders/calendar"
        profileId="home-mock-profile"
        canEdit={false}
      />
    </div>
  );
}
