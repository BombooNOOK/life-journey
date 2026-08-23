import { cookies } from "next/headers";

/**
 * Legacy / non-authoritative viewer email from `lj_user_email`.
 *
 * AI-8.1a: Still used by existing journal/account routes. Not Firebase-token
 * verified. For verified identity use getVerifiedViewerSession() (lj_session).
 */
export async function getViewerEmailFromCookie(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get("lj_user_email")?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).trim().toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function normalizeEmail(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}
