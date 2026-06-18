import type { ReactNode } from "react";

import { MyPageManageMenuRow } from "@/components/orders/MyPageManageMenuRow";

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

type HubProps = {
  activeProfileId: string | null;
};

/** マイページ下部：設定・アカウント・お問い合わせ履歴の控えめな導線 */
export function MyPageManageHub({ activeProfileId }: HubProps) {
  const profileRenameHref = activeProfileId
    ? "/orders/settings/rename-profile"
    : "/orders/settings/add-profile";

  return (
    <div className="w-full space-y-5 border-t border-stone-200/80 pt-5">
      <MyPageManageMenuSection
        title="設定"
        description="プロフィールや表示の設定を変更できます"
      >
        <MyPageManageMenuRow
          href="/orders/settings/add-profile"
          label="プロフィールを追加"
          icon="＋"
          loadingLabel="プロフィール追加を開いています…"
        />
        <MyPageManageMenuRow
          href={profileRenameHref}
          label="プロフィール名を変更"
          icon="✎"
          loadingLabel="プロフィール名の変更を開いています…"
        />
        <MyPageManageMenuRow
          href="/orders/settings/display"
          label="表示設定"
          icon="Aa"
          loadingLabel="表示設定を開いています…"
        />
        <MyPageManageMenuRow
          href="/orders/settings/backup"
          label="バックアップ作成"
          icon="↓"
          loadingLabel="バックアップ作成を開いています…"
        />
      </MyPageManageMenuSection>

      <MyPageManageMenuSection
        title="アカウント情報"
        description="登録情報や利用状況を確認できます"
      >
        <MyPageManageMenuRow
          href="/orders/account"
          label="アカウント情報"
          icon="◎"
          loadingLabel="アカウント情報を開いています…"
        />
      </MyPageManageMenuSection>

      <MyPageManageMenuSection
        title="お問い合わせ履歴"
        description="これまでのお問い合わせを確認できます"
      >
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
