/**
 * @deprecated 14日無料トライアルは廃止。初回あしあと作成でトライアル開始は行わない。
 * 呼び出し側互換のため関数シグネチャのみ残す（no-op）。
 */
export async function markFreeTrialStartedIfFirstJournal(_params: {
  email: string;
  wasFirstJournal: boolean;
  now?: Date;
}): Promise<void> {
  return;
}
