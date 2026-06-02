/** GET /api/journal/sync-status のレスポンス（Mac / iPhone 比較用） */
export type JournalSyncStatusResponse = {
  code: "OK";
  serverTime: string;
  deployment: {
    vercelEnv: string | null;
    vercelUrl: string | null;
    requestHost: string | null;
  };
  auth: {
    cookieLoggedIn: boolean;
    viewerEmail: string;
    cookieProfileId: string | null;
    firebaseEmailFromClient: string | null;
    firebaseServerEmailMismatch: boolean;
  };
  profile: {
    activeProfileId: string;
    queriedProfileId: string;
    profileIdsUsedInQuery: string[];
    activeMatchesQueried: boolean;
  };
  month: {
    key: string | null;
    entryCountStrictProfile: number;
    entryCountIncludingLegacyOrphan: number;
    orphanLegacyProfileIdEmptyCount: number;
  };
  day: {
    key: string | null;
    entryIds: string[];
    entryCount: number;
  };
  entryProbe: {
    requestedId: string | null;
    found: boolean;
    belongsToViewer: boolean;
    profileId: string | null;
    dayKeyJapan: string | null;
    visibleUnderQueriedProfile: boolean;
    includedInMonthQuery: boolean;
    includedOnRequestedDay: boolean;
  };
  latestEntries: Array<{
    id: string;
    profileId: string;
    dayKeyJapan: string;
    createdAt: string;
    updatedAt: string;
    contentPreview: string;
  }>;
  /** Mac / iPhone で同じ文字列なら DB・ユーザー・プロフィール・月の取得は一致 */
  compareFingerprint: string;
  /** この端末単体でのチェック（2台比較は fingerprint と各 checks を見る） */
  checks: {
    authOk: boolean;
    profileOk: boolean;
    monthHasAnyEntry: boolean;
    dayHasEntry: boolean | null;
    entryFound: boolean | null;
    entryBelongsToViewer: boolean | null;
    entryVisibleUnderProfile: boolean | null;
    firebaseMatchesServer: boolean | null;
  };
  /** 2台比較後に想定される分岐（参考ラベル） */
  branchHints: string[];
};
