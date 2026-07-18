import type { Metadata } from "next";

import { ForestBookshelfPreviewClient } from "@/components/orders/forest-bookshelf/ForestBookshelfPreviewClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：森の本棚",
};

/** 森の本棚プレビュー（フィクスチャ・ログイン不要） */
export default function ForestBookshelfPreviewPage() {
  return <ForestBookshelfPreviewClient />;
}
