import type { Metadata } from "next";

import { ForestMapLayoutDebugClient } from "@/app/preview/forest-map/layout/ForestMapLayoutDebugClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：森の案内図タップ領域",
};

/** 案内図タップ領域の確認（開発、または本番の管理者） */
export default async function ForestMapLayoutPreviewPage() {
  await assertDevOrAdminPreviewAccess();
  return <ForestMapLayoutDebugClient />;
}
