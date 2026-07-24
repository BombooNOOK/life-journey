import { LogHouseOfflineBrowseClient } from "@/components/orders/LogHouseOfflineBrowseClient";

/** 未ログインで /orders に来たとき：室内を見せつつログイン案内 */
export function LogHouseGuestEntrance() {
  return <LogHouseOfflineBrowseClient mode="guest" />;
}
