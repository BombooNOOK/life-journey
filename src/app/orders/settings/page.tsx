import Link from "next/link";
import { redirect } from "next/navigation";

import { MyPageManageMenuRow, MyPageManageMenuSection } from "@/components/orders/MyPageManageMenu";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import {
  RECORD_BACKUP_LABEL,
  RECORD_BACKUP_LOADING_LABEL,
  RESIDENT_REGISTRATION_INFO_LABEL,
  RESIDENT_REGISTRATION_INFO_LOADING_LABEL,
} from "@/lib/account/residentRegistrationUiCopy";
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
        description="住民票・登録情報・記録のバックアップを確認できます"
      />

      <MyPageManageMenuSection
        title="森のくらし"
        description="住民票と登録内容の確認、あしあとの書き出しができます"
      >
        <MyPageManageMenuRow
          href="/orders/resident-card"
          label="森の住民票"
          icon="◎"
          loadingLabel="森の住民票を開いています…"
        />
        <MyPageManageMenuRow
          href="/orders/account"
          label={RESIDENT_REGISTRATION_INFO_LABEL}
          icon="☰"
          loadingLabel={RESIDENT_REGISTRATION_INFO_LOADING_LABEL}
        />
        <MyPageManageMenuRow
          href="/orders/settings/backup"
          label={RECORD_BACKUP_LABEL}
          icon="↓"
          loadingLabel={RECORD_BACKUP_LOADING_LABEL}
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
