import type { JournalSocialPostTemplateId } from "./templates";

const RULER_PATH = "/preview/journal-social-post-image/layout";

export function parseJournalSocialPostLayoutRulerReturnTo(
  raw: string | null | undefined,
): string | null {
  const value = raw?.trim();
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function parseJournalSocialPostLayoutTemplate(
  raw: string | null | undefined,
): JournalSocialPostTemplateId | null {
  return raw === "sns03" ? "sns03" : raw === "sns02" ? "sns02" : null;
}

export function buildJournalSocialPostLayoutRulerHref(input?: {
  template?: JournalSocialPostTemplateId;
  returnTo?: string;
}): string {
  const params = new URLSearchParams();
  if (input?.template) params.set("template", input.template);
  if (input?.returnTo) params.set("returnTo", input.returnTo);
  const qs = params.toString();
  return qs ? `${RULER_PATH}?${qs}` : RULER_PATH;
}
