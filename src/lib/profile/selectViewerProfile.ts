/** クライアント: 選択中プロフィール cookie（lj_profile_id）を更新 */
export async function selectViewerProfile(profileId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/profiles/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ profileId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "プロフィールの切り替えに失敗しました。" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "プロフィールの切り替えに失敗しました。" };
  }
}
