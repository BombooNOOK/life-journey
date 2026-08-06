import {
  JOURNAL_SOCIAL_POST_TEMPLATES,
  normalizeJournalSocialPostTemplateId,
  type JournalSocialPostTemplateId,
} from "./templates";

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
  if (!raw?.trim()) return null;
  const normalized = normalizeJournalSocialPostTemplateId(raw);
  // 未知IDは normalize が sns02 に落とすので、明示一致のみ通す
  return raw in JOURNAL_SOCIAL_POST_TEMPLATES ? normalized : null;
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
