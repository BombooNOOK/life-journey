import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

/** 全ページ共通フッター */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200/80 bg-[#faf8f5]/90">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-8">
        <p className="text-xs leading-relaxed text-stone-500">
          © BambooNOOK / Life Journey Diary
        </p>
        <LegalFooterLinks />
      </div>
    </footer>
  );
}
