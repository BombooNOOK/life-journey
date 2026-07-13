import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { KanteiHallPageContent } from "@/components/orders/KanteiHallPageContent";
import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  KANTEI_HALL_PAGE_DESCRIPTION,
  KANTEI_HALL_PAGE_PATH,
  KANTEI_HALL_PAGE_TITLE,
} from "@/lib/kantei/kanteiHallCopy";
import { buildKanteiHallSummary } from "@/lib/kantei/kanteiHallSummary";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { numerologyWithRefreshedLifePath } from "@/lib/order/numerologyDisplay";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { resolveForestGuideMapKanteiHallContext } from "@/lib/viewer/forestGuideMapKanteiHallContext";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: KANTEI_HALL_PAGE_TITLE,
  description: KANTEI_HALL_PAGE_DESCRIPTION,
};

export default async function KanteiHallPage() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    redirect(`/login?returnTo=${encodeURIComponent(KANTEI_HALL_PAGE_PATH)}`);
  }

  const { branch } = await resolveForestGuideMapKanteiHallContext(viewerEmail);
  if (branch === "guestOrNoResident") {
    redirect(FIRST_VISIT_ROUTES.pathGuide);
  }
  if (branch === "residentNoKantei") {
    redirect(FIRST_VISIT_ROUTES.kanteiReady);
  }

  const { activeProfileId } = await listProfilesAndActiveProfileId(viewerEmail);
  if (!activeProfileId) {
    redirect("/orders");
  }

  const order = await findKanteiOrderForProfile({
    viewerEmail,
    profileId: activeProfileId,
  });
  if (!order) {
    redirect(FIRST_VISIT_ROUTES.kanteiReady);
  }

  const numerology = numerologyWithRefreshedLifePath(order.numerologyJson, order.birthDate, {
    birthYear: order.birthYear,
    birthMonth: order.birthMonth,
    birthDay: order.birthDay,
  });
  if (!numerology) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
        数秘データの読み込みに失敗しました。
      </div>
    );
  }

  const summary = buildKanteiHallSummary({
    numerology,
    birthMonth: order.birthMonth,
    birthDay: order.birthDay,
  });

  return <KanteiHallPageContent summary={summary} />;
}
