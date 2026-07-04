import type { Metadata } from "next";

import { LjdNumerologyReadingPage } from "@/components/help/ljdNumerologyReading/LjdNumerologyReadingPage";
import { LJD_NUMEROLOGY_READING_PAGE_TITLE } from "@/lib/help/ljdNumerologyReading/introCopy";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: LJD_NUMEROLOGY_READING_PAGE_TITLE,
};

export default function HelpLjdNumerologyReadingRoutePage() {
  return <LjdNumerologyReadingPage />;
}
