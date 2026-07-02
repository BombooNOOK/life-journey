import { redirect } from "next/navigation";

import { MyPageDisplaySettingsSection } from "@/components/orders/MyPageDisplaySettingsSection";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  buildDisplaySettingsPath,
  displaySettingsBackLabel,
  parseDisplaySettingsReturnTo,
} from "@/lib/navigation/displaySettingsNav";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function MyPageSettingsDisplayPage({ searchParams }: Props) {
  const { returnTo: returnToRaw } = await searchParams;
  const displayPath = buildDisplaySettingsPath(returnToRaw ?? null);

  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(displayPath)}`);
  }

  const backHref = parseDisplaySettingsReturnTo(returnToRaw);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="表示設定"
        description="文字の大きさなど、読みやすさの設定を変更できます"
        backHref={backHref}
        backLabel={displaySettingsBackLabel(backHref)}
      />

      <MyPageDisplaySettingsSection showHeading={false} />
    </div>
  );
}
