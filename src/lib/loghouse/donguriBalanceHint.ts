const STORAGE_PREFIX = "ljd:donguriBalance:";

/** あしあと保存直後などに、次画面で即表示するための残高ヒント */
export function writeDonguriBalanceHint(profileId: string, balance: number): void {
  const id = profileId.trim();
  if (!id || !Number.isFinite(balance)) return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${id}`, String(Math.max(0, Math.floor(balance))));
  } catch {
    // ignore
  }
}

export function readDonguriBalanceHint(profileId: string): number | null {
  const id = profileId.trim();
  if (!id) return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function clearDonguriBalanceHint(profileId: string): void {
  const id = profileId.trim();
  if (!id) return;
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${id}`);
  } catch {
    // ignore
  }
}
