import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ForestBookshelfPreviewClient } from "@/components/orders/forest-bookshelf/ForestBookshelfPreviewClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：森の本棚",
};

export default async function ForestBookshelfPreviewPage() {
  try {
    await assertDevOrAdminPreviewAccess();
  } catch {
    redirect("/");
  }

  return <ForestBookshelfPreviewClient />;
}
