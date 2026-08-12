import { notFound } from "next/navigation";

import SaveWiringPocClient from "@/app/preview/save-wiring-poc/SaveWiringPocClient";

/**
 * Developer-only 4B-4L L1–L13 runner. Production → 404.
 */
export default function SaveWiringPocPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-stone-900">
      <div className="mx-auto max-w-lg space-y-2 px-4 py-6">
        <p className="text-xs text-stone-500">Developer · 4B-4L save wiring PoC</p>
        <h1 className="text-lg font-semibold">L1–L13 internal save wiring</h1>
        <SaveWiringPocClient />
      </div>
    </main>
  );
}
