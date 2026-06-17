import Link from "next/link";
import type { ReactNode } from "react";

type MenuRowProps = {
  href: string;
  label: string;
  icon: ReactNode;
};

const rowClass =
  "flex min-h-[48px] items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-[#f7f3eb]/80 active:bg-[#f3ede3]/90";

const iconWrapClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3ede3] text-[13px] text-[#6B5638]";

export function MyPageManageMenuRow({ href, label, icon }: MenuRowProps) {
  return (
    <Link href={href} className={rowClass}>
      <span className={iconWrapClass} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-stone-800">{label}</span>
      <span className="shrink-0 text-sm text-stone-300" aria-hidden>
        →
      </span>
    </Link>
  );
}

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
    ? `/orders/profile/${encodeURIComponent(activeProfileId)}`
    : "/orders/settings#add-profile";

  return (
    <div className="mx-auto w-full max-w-md space-y-5 border-t border-stone-200/80 pt-5">
      <MyPageManageMenuSection
        title="設定"
        description="プロフィールや表示の設定を変更できます"
      >
        <MyPageManageMenuRow href="/orders/settings#add-profile" label="プロフィールを追加" icon="＋" />
        <MyPageManageMenuRow href={profileRenameHref} label="プロフィール名を変更" icon="✎" />
        <MyPageManageMenuRow href="/orders/settings#display" label="表示設定" icon="Aa" />
        <MyPageManageMenuRow href="/orders/settings#backup" label="バックアップ作成" icon="↓" />
      </MyPageManageMenuSection>

      <MyPageManageMenuSection
        title="アカウント情報"
        description="登録情報や利用状況を確認できます"
      >
        <MyPageManageMenuRow href="/orders/account" label="アカウント情報" icon="◎" />
      </MyPageManageMenuSection>

      <MyPageManageMenuSection
        title="お問い合わせ履歴"
        description="これまでのお問い合わせを確認できます"
      >
        <MyPageManageMenuRow href="/orders/support" label="お問い合わせ履歴" icon="✉" />
      </MyPageManageMenuSection>
    </div>
  );
}
