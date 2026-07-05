import { Suspense } from "react";

import { CompanionWritingPage } from "@/components/journal/companion-writing/CompanionWritingPage";
import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";

export default function JournalWithCompanionPage() {
  return (
    <Suspense fallback={<OwlSuspenseFallback label="読み込んでいます…" />}>
      <CompanionWritingPage />
    </Suspense>
  );
}
