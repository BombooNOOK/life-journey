/**
 * Stripe は隔離中。どんぐり / 森の定期便の Checkout 確認 UI は出さない。
 * （将来の製本便・物理商品向けのコード自体は src/lib/stripe に残す）
 */
export function StripeIsolationNote({
  enabled,
  stripeMode,
}: {
  enabled: boolean;
  stripeMode: "test" | "live";
}) {
  if (!enabled) return null;

  return (
    <section className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-4 text-sm text-stone-700">
      <h2 className="text-base font-semibold text-stone-900">Stripe（隔離中）</h2>
      <p className="mt-1 text-xs leading-relaxed text-stone-600">
        どんぐり購入・森の定期便は Stripe では扱いません（アプリ内課金で再設計予定）。
        ユーザー向け Checkout は停止中です。STRIPE_MODE={stripeMode} /
        STRIPE_CHECKOUT_ENABLED=false。
      </p>
      <p className="mt-2 text-xs leading-relaxed text-stone-600">
        既存の subscription 同期・解約・Webhook コードは互換のため残しています。将来の製本便など
        Web 決済で再利用する可能性があります。
      </p>
    </section>
  );
}
