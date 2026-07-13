/**
 * どんぐり所持・きろく（UI用）。
 * 本格的なウォレットは未実装のため、当面は表示用スタブを返す。
 */

export type DonguriLedgerKind = "delivery" | "spend";

export type DonguriLedgerEntry = {
  id: string;
  kind: DonguriLedgerKind;
  /** 例: ヤギさん郵便 / 日記を本棚に保存 */
  label: string;
  delta: number;
  createdAt: string;
};

export type DonguriChoView = {
  balance: number;
  /** 今日のおとどけ（あれば） */
  todayDelivery: { label: string; delta: number } | null;
  recent: DonguriLedgerEntry[];
};

/** ログハウスUI向けの仮どんぐり帳（本番ウォレット接続までの表示用） */
export function getStubDonguriChoView(): DonguriChoView {
  return {
    balance: 12,
    todayDelivery: { label: "ヤギさん郵便", delta: 1 },
    recent: [
      {
        id: "stub-1",
        kind: "spend",
        label: "日記を本棚に保存",
        delta: -3,
        createdAt: new Date().toISOString(),
      },
      {
        id: "stub-2",
        kind: "delivery",
        label: "ヤギさん郵便",
        delta: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: "stub-3",
        kind: "spend",
        label: "お花の種を購入",
        delta: -5,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function formatDonguriDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}
