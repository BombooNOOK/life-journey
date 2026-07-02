import { Suspense } from "react";

import { CompanionWritingPage } from "@/components/journal/companion-writing/CompanionWritingPage";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

export default function JournalWithCompanionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-lg justify-center px-4 py-16">
          <OwlLoadingInline label="読み込み中…" size="md" />
        </div>
      }
    >
      <CompanionWritingPage />
    </Suspense>
  );
}
