import type { Metadata } from "next";

import { MyPageDisplaySettingsSection } from "@/components/orders/MyPageDisplaySettingsSection";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { parseReadingFontSizeReturnTo } from "@/lib/navigation/readingFontSizeNav";

export const metadata: Metadata = {
  title: "文字の大きさ",
  description: "Life Journey Diary の文字サイズを、読みやすい大きさに変更できます。",
};

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

/** 未ログイン向け：文字サイズ変更の単品ページ */
export default async function ReadingFontSizeSettingsPage({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  const backHref = parseReadingFontSizeReturnTo(returnTo);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="文字の大きさ"
        description="読みやすいサイズを選んでください。"
        backHref={backHref}
        backLabel="もどる"
      />

      <MyPageDisplaySettingsSection showHeading={false} />
    </div>
  );
}
