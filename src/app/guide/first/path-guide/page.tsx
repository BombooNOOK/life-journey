import type { Metadata } from "next";

import { FirstVisitPathGuidePage } from "@/components/guide/first-visit/FirstVisitPathGuidePage";
import { FIRST_VISIT_PATH_GUIDE_TITLE } from "@/lib/onboarding/firstVisitWizard/pathGuideCopy";

export const metadata: Metadata = {
  title: FIRST_VISIT_PATH_GUIDE_TITLE,
};

export default function FirstVisitPathGuideRoutePage() {
  return <FirstVisitPathGuidePage />;
}
