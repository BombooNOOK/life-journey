import { notFound } from "next/navigation";

import SaveIntentPocClient from "@/app/preview/save-intent-poc/SaveIntentPocClient";

/**
 * Developer-only 4B-4O I1–I9 runner. Production → 404.
 */
export default function SaveIntentPocPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-stone-900">
      <div className="mx-auto max-w-lg space-y-2 px-4 py-6">
        <p className="text-xs text-stone-500">
          Developer · 4B-4O local save operation intent PoC
        </p>
        <h1 className="text-lg font-semibold">I1–I9 local save intent</h1>
        <SaveIntentPocClient />
      </div>
    </main>
  );
}
