import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DeskWritePreviewClient } from "@/components/orders/DeskWritePreviewClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：今日はどうしますか？（スマホ枠）",
};

export default async function DeskWritePreviewPage() {
  try {
    await assertDevOrAdminPreviewAccess();
  } catch {
    redirect("/");
  }

  return <DeskWritePreviewClient />;
}
