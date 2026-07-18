import { notFound } from "next/navigation";

import { LogHouseTourPreviewClient } from "@/components/orders/loghouse-room/LogHouseTourPreviewClient";

export const dynamic = "force-dynamic";

/** はじめてのログハウス案内の通し確認（ログイン不要・devのみ） */
export default function LogHouseTourPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <LogHouseTourPreviewClient />;
}
