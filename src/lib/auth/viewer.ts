import { cookies } from "next/headers";

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
