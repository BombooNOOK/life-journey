import { redirect } from "next/navigation";

import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

export default function GuideFirstIndexPage() {
  redirect(FIRST_VISIT_ROUTES.pathGuide);
}
