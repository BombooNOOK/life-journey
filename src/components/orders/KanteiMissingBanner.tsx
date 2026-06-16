import Link from "next/link";

type Props = {
  profileId: string;
  blockNewKantei?: boolean;
};

/** 選択中プロフィールに鑑定Orderがないときの再鑑定導線 */
export function KanteiMissingBanner({ profileId, blockNewKantei = false }: Props) {
  const orderHref = `/order?profile=${encodeURIComponent(profileId)}`;

  return (
    <section
      aria-labelledby="kantei-missing-banner-heading"
      className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm sm:p-5"
    >
      <h2 id="kantei-missing-banner-heading" className="text-sm font-semibold text-amber-950">
        このプロフィールには鑑定情報がありません。
      </h2>
      <p className="mt-2 lj-read-desc text-amber-950/90">
        バックアップから復元されたプロフィールなどでは、日記本文と写真は戻りますが、鑑定書は復元されません。
        鑑定を作成すると、鑑定書が本棚に表示され、今後の日記の数字やコメント生成にも使えるようになります。
      </p>
      {blockNewKantei ? (
        <p className="mt-4 lj-read-desc text-amber-950/90">
          新規鑑定の作成は、日記の無料お試し開始後にご利用いただけます。まずは日記の記録からお試しください。
        </p>
      ) : (
        <Link
          href={orderHref}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900"
        >
          鑑定を作成する
        </Link>
      )}
    </section>
  );
}
