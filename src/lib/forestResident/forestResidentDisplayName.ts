/** 住民票カードのおなまえ（表示・保存とも最大7文字） */
export const FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH = 7 as const;

export function clampForestResidentDisplayName(value: string): string {
  return value.trim().slice(0, FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH);
}

/**
 * 保存用に正規化。空文字は null（プロフィール名へのフォールバック）。
 * 長すぎる場合は null（呼び出し側でエラーにする）。
 */
export function parseForestResidentDisplayNameInput(
  raw: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "おなまえを入力してください。" };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, value: null };
  }
  if (trimmed.length > FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `おなまえは${FOREST_RESIDENT_DISPLAY_NAME_MAX_LENGTH}文字以内で入力してください。`,
    };
  }
  return { ok: true, value: trimmed };
}
