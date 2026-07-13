import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LogHouseGoOutPageContent } from "@/components/orders/LogHouseGoOutPageContent";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { forestGuideMapKanteiHallLink } from "@/lib/help/forestGuideMapKanteiHallLink";
import {
  LOG_HOUSE_GO_OUT_PAGE_DESCRIPTION,
  LOG_HOUSE_GO_OUT_PAGE_PATH,
  LOG_HOUSE_GO_OUT_PAGE_TITLE,
} from "@/lib/loghouse/logHouseGoOutCopy";
import { resolveForestGuideMapKanteiHallContext } from "@/lib/viewer/forestGuideMapKanteiHallContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: LOG_HOUSE_GO_OUT_PAGE_TITLE,
  description: LOG_HOUSE_GO_OUT_PAGE_DESCRIPTION.replace(/\n/g, " "),
};

export default async function LogHouseGoOutPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(LOG_HOUSE_GO_OUT_PAGE_PATH)}`);
  }

  const { branch } = await resolveForestGuideMapKanteiHallContext(viewerEmail);
  const kanteiHallHref = forestGuideMapKanteiHallLink(branch).href;

  return <LogHouseGoOutPageContent kanteiHallHref={kanteiHallHref} />;
}
