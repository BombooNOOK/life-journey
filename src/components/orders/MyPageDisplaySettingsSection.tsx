import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";

/** マイページ：表示設定（文字サイズ） */
export function MyPageDisplaySettingsSection() {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <ReadingFontSizeControl variant="section" />
    </section>
  );
}
