import Link from "next/link";

import {
  PRIVACY_POLICY_LABEL,
  PRIVACY_POLICY_PATH,
  TERMS_OF_SERVICE_LABEL,
  TERMS_OF_SERVICE_PATH,
} from "@/lib/legal/legalDocumentLinks";

type Props = {
  className?: string;
  /** 利用規約リンクを将来有効化するまで false */
  showTermsLink?: boolean;
};

const linkClass =
  "text-stone-600 underline-offset-2 transition hover:text-stone-900 hover:underline";

/** フッター・マイページ下部などで共通利用する法務リンク */
export function LegalFooterLinks({ className = "", showTermsLink = false }: Props) {
  return (
    <nav
      aria-label="法務情報"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 sm:text-sm ${className}`.trim()}
    >
      <Link href={PRIVACY_POLICY_PATH} className={linkClass}>
        {PRIVACY_POLICY_LABEL}
      </Link>
      {showTermsLink ? (
        <Link href={TERMS_OF_SERVICE_PATH} className={linkClass}>
          {TERMS_OF_SERVICE_LABEL}
        </Link>
      ) : (
        <span className="text-stone-400" aria-hidden>
          {TERMS_OF_SERVICE_LABEL}（準備中）
        </span>
      )}
    </nav>
  );
}
