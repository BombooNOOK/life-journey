import Link from "next/link";

/**
 * マイページ上部のプラン導線カード。
 * 次フェーズで trialEndsAt / lightPlanActive に応じた表示へ拡張予定。
 */
export function PlanStatusCard() {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-stone-900">現在のご利用について</h2>
      <p className="mt-3 text-sm leading-relaxed text-stone-700">
        初回14日間は無料でお試しいただけます。
        <br />
        日記・本棚・鑑定書PDFを使いながら、Life Journey Diaryの流れを確認できます。
      </p>
      <p className="mt-3 text-sm leading-relaxed text-stone-700">
        無料期間終了後も続ける場合は、どんぐりと森の定期便のご案内をご確認ください（現在準備中です）。
      </p>
      <Link
        href="/plans"
        className="mt-4 inline-flex rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-900"
      >
        どんぐりと森の定期便
      </Link>
    </section>
  );
}
