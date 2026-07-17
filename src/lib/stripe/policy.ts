/**
 * Stripe 利用方針（停止・隔離）
 *
 * - どんぐり購入・森の定期便は Stripe では扱わない（アプリ内課金で再設計予定）
 * - ユーザー向け購入導線から Checkout を呼ばない（STRIPE_CHECKOUT_ENABLED=false）
 * - コードは削除せず残す。将来の製本便・物理商品など Web 決済の候補として隔離
 * - 既存 subscription / webhook / 解約フローは互換のため維持
 */
export const STRIPE_POLICY = {
  /** ユーザー向け Checkout は原則停止 */
  userCheckoutEnabled: false,
  /** Stripe では販売しない（IAP 予定）プロダクト */
  notSoldViaStripe: ["acorn_50", "forest_delivery"] as const,
  /** 将来の Web 決済候補（製本便・物理商品など）。現時点は未実装 */
  reservedForFutureWebCheckout: ["physical_binding", "physical_goods"] as const,
} as const;

export type StripeNotSoldProduct = (typeof STRIPE_POLICY.notSoldViaStripe)[number];

export function isStripeNotSoldProduct(plan: string): plan is StripeNotSoldProduct {
  return (STRIPE_POLICY.notSoldViaStripe as readonly string[]).includes(plan);
}
