import Link from "next/link";
import { redirect } from "next/navigation";

import { MyPageManageMenuRow, MyPageManageMenuSection } from "@/components/orders/MyPageManageMenu";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { loadMyPageSettingsContext } from "@/lib/mypage/loadMyPageSettingsContext";

export const dynamic = "force-dynamic";

export default async function MyPageSettingsIndexPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings");
  }

  const { activeProfileId } = await loadMyPageSettingsContext(viewerEmail);
  const renameHref = activeProfileId
    ? "/orders/settings/rename-profile"
    : "/orders/settings/add-profile";

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="設定"
        description="プロフィールや表示の設定を変更できます"
      />

      <MyPageManageMenuSection title="項目を選ぶ" description="変更したい設定を選んでください">
        <MyPageManageMenuRow href="/orders/settings/add-profile" label="プロフィールを追加" icon="＋" />
        <MyPageManageMenuRow href={renameHref} label="プロフィール名を変更" icon="✎" />
        <MyPageManageMenuRow href="/orders/settings/display" label="表示設定" icon="Aa" />
        <MyPageManageMenuRow href="/orders/settings/backup" label="バックアップ作成" icon="↓" />
      </MyPageManageMenuSection>

      <p>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          マイページへ戻る
        </Link>
      </p>
    </div>
  );
}
