import { Suspense } from "react";
import { notFound } from "next/navigation";

import { LocalE2eHarnessClient } from "@/components/local-e2e/LocalE2eHarnessClient";
import { evaluateLocalE2eHarnessGate } from "@/lib/localE2eHarness/gate";

/**
 * Developer-only local E2E harness panel (AI-5.2).
 * Production / Preview without gates → 404. Not a product surface.
 */
export default function LocalE2eHarnessPage() {
  const gate = evaluateLocalE2eHarnessGate({
    requestHost: "127.0.0.1",
  });
  // Page render also refuses production NODE_ENV even if flags are mis-set.
  if (process.env.NODE_ENV === "production" || !gate.ok) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3] px-4 py-8 text-stone-900">
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-xs font-medium tracking-wide text-stone-500">
          Developer tool · Local Runtime E2E harness
        </p>
        <h1 className="text-xl font-semibold">Local E2E Harness</h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Fixed local actor session and one-shot fault adapters for AI-5. Not a general auth
          bypass. Production builds must 404 this page.
        </p>
        <Suspense fallback={<p className="text-sm text-stone-500">読み込み中…</p>}>
          <LocalE2eHarnessClient />
        </Suspense>
      </div>
    </div>
  );
}
