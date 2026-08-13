import { notFound } from "next/navigation";

import SaveOperationE2eClient from "@/app/preview/save-operation-e2e/SaveOperationE2eClient";

/**
 * Developer-only 4B-4Q internal E2E. Production → 404.
 * Does not call production POST /api/journal or Neon.
 */
export default function SaveOperationE2ePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f4f6f3] text-stone-900">
      <div className="mx-auto max-w-lg space-y-2 px-4 py-6">
        <p className="text-xs text-stone-500">
          Developer · 4B-4Q internal save-operation E2E
        </p>
        <h1 className="text-lg font-semibold">Save operation recovery E2E</h1>
        <SaveOperationE2eClient />
      </div>
    </main>
  );
}
