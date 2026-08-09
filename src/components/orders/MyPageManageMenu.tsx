import type { ReactNode } from "react";

import { MyPageManageMenuRow } from "@/components/orders/MyPageManageMenuRow";
import {
  ASHIATO_BACKUP_LABEL,
  ASHIATO_BACKUP_LOADING_LABEL,
  RESIDENT_REGISTRATION_INFO_LABEL,
  RESIDENT_REGISTRATION_INFO_LOADING_LABEL,
} from "@/lib/account/residentRegistrationUiCopy";

export { MyPageManageMenuRow } from "@/components/orders/MyPageManageMenuRow";

type SectionProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function MyPageManageMenuSection({ title, description, children, className = "" }: SectionProps) {
  return (
    <section className={["space-y-2", className].join(" ")}>
      <div>
        <h2 className="text-base font-semibold text-stone-900">{title}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{description}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#e8dfd0]/90 bg-[#fcfaf6] shadow-sm">
        <div className="divide-y divide-[#ebe4d8]/80">{children}</div>
      </div>
    </section>
  );
}

/** ログハウス歯車／設定：住民票・住民登録情報・あしあとのバックアップを軸にする */
export function MyPageManageHub() {
  return (
    <div className="w-full space-y-5 border-t border-stone-200/80 pt-5">
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
          label={ASHIATO_BACKUP_LABEL}
          icon="↓"
          loadingLabel={ASHIATO_BACKUP_LOADING_LABEL}
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
    </div>
  );
}
