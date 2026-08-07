import { notFound } from "next/navigation";

import { OverlayAlphaDebugClient } from "@/app/preview/mori-log-device-movie/overlay-alpha/OverlayAlphaDebugClient";

export default function OverlayAlphaDebugPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="min-h-[100dvh] bg-[#f3ebe0]">
      <OverlayAlphaDebugClient />
    </main>
  );
}
