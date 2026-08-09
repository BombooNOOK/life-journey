import Link from "next/link";
import { redirect } from "next/navigation";

import { MyPageManageMenuRow, MyPageManageMenuSection } from "@/components/orders/MyPageManageMenu";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";

export const dynamic = "force-dynamic";

export default async function MyPageSettingsIndexPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect("/login?returnTo=/orders/settings");
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title="設定"
        description="住民票・アカウント・データの確認ができます"
      />

      <MyPageManageMenuSection
        title="森のくらし"
        description="本人の住民票と、アカウント周りの確認ができます"
      >
        <MyPageManageMenuRow
          href="/orders/resident-card"
          label="森の住民票"
          icon="◎"
          loadingLabel="森の住民票を開いています…"
        />
        <MyPageManageMenuRow
          href="/orders/account"
          label="アカウント情報"
          icon="☰"
          loadingLabel="アカウント情報を開いています…"
        />
        <MyPageManageMenuRow
          href="/orders/settings/backup"
          label="データ管理"
          icon="↓"
          loadingLabel="データ管理を開いています…"
        />
      </MyPageManageMenuSection>

      <MyPageManageMenuSection
        title="表示・サポート"
        description="見やすさやお問い合わせの確認ができます"
      >
        <MyPageManageMenuRow
          href="/orders/settings/display"
          label="表示設定"
          icon="Aa"
          loadingLabel="表示設定を開いています…"
        />
        <MyPageManageMenuRow
          href="/orders/support"
          label="お問い合わせ履歴"
          icon="✉"
          loadingLabel="お問い合わせ履歴を開いています…"
        />
      </MyPageManageMenuSection>

      <p>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          {LOG_HOUSE_RETURN_TO_LABEL}
        </Link>
      </p>
    </div>
  );
}
