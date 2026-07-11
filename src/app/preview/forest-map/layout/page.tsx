import { notFound } from "next/navigation";

import { ForestMapLayoutDebugClient } from "@/app/preview/forest-map/layout/ForestMapLayoutDebugClient";

export default function ForestMapLayoutPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <ForestMapLayoutDebugClient />;
}
