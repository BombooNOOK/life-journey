import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import {
  forestGuideMapKanteiHallLink,
  type ForestGuideMapCoreNumber,
} from "@/lib/help/forestGuideMapKanteiHallLink";
import { maturityNumberFromNumerology } from "@/lib/numerology/reduce";
import { normalizeNumerologyResult } from "@/lib/order/numerologyDisplay";
import { listProfilesAndActiveProfileId } from "@/lib/profile/activeProfile";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import { resolveForestGuideMapKanteiHallContext } from "@/lib/viewer/forestGuideMapKanteiHallContext";

function coreNumbersFromOrderJson(numerologyJson: string | null): ForestGuideMapCoreNumber[] | undefined {
  if (!numerologyJson?.trim()) return undefined;
  try {
    const numerology = normalizeNumerologyResult(JSON.parse(numerologyJson) as unknown);
    if (!numerology) return undefined;
    const maturity = maturityNumberFromNumerology(numerology);
    return [
      { label: "ライフパス", value: numerology.lifePathNumber },
      { label: "ディスティニー", value: numerology.destinyNumber },
      { label: "ソウル", value: numerology.soulNumber },
      { label: "パーソナリティ", value: numerology.personalityNumber },
      { label: "バースデー", value: numerology.birthdayNumber },
      { label: "マチュリティ", value: maturity },
    ];
  } catch {
    return undefined;
  }
}

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  const { branch } = await resolveForestGuideMapKanteiHallContext(viewerEmail);
  const link = forestGuideMapKanteiHallLink(branch);

  if (branch !== "hasKantei" || !viewerEmail?.trim()) {
    return NextResponse.json(link);
  }

  const { activeProfileId } = await listProfilesAndActiveProfileId(viewerEmail);
  if (!activeProfileId) {
    return NextResponse.json(link);
  }

  const order = await findKanteiOrderForProfile({
    viewerEmail,
    profileId: activeProfileId,
  });
  const coreNumbers = coreNumbersFromOrderJson(order?.numerologyJson ?? null);

  return NextResponse.json({
    ...link,
    ...(coreNumbers ? { coreNumbers } : {}),
  });
}
