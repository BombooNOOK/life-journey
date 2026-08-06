"use client";

import { LogHouseOfflineBrowseClient } from "@/components/orders/LogHouseOfflineBrowseClient";

type Props = {
  detail: string;
};

/** /orders の DB エラー時：エラーだけで止めず、仮の室内を表示 */
export function LogHouseLoadErrorPanel({ detail }: Props) {
  return <LogHouseOfflineBrowseClient mode="error" errorDetail={detail} />;
}
