/** Firebase ログイン後、API が参照する `lj_user_email` サーバー Cookie を揃える */
export async function syncServerAuthSession(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  try {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: normalized }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function readServerAuthSessionEmail(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
    const data = (await res.json()) as { email?: string | null };
    const email = data.email ? String(data.email).trim().toLowerCase() : "";
    return email || null;
  } catch {
    return null;
  }
}
