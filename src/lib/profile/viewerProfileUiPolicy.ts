/**
 * LJD 本人中心化：複数 Profile は内部パーティションのみ。
 * 一般ユーザー向け UI／新規作成は出さない。admin のみ既存切替を残す。
 */

/** 一般ユーザー向けの新規 Profile 作成は停止（admin も不要） */
export function isViewerProfileCreateEnabled(): boolean {
  return false;
}

/** 既存複数 Profile の切替 UI を出せるか（admin かつ 2件以上） */
export function canShowAdminProfileSwitchUi(params: {
  isAdmin: boolean;
  profileCount: number;
}): boolean {
  return params.isAdmin && params.profileCount > 1;
}

export const PROFILE_CREATE_DISABLED_USER_MESSAGE =
  "新しい記録枠の追加は、現在ご利用いただけません。" as const;
