/** トップ：森の案内板（スマホ縦長・昼） */
export const HOME_FOREST_SIGN_MOBILE_BG_DAY_SRC =
  "/images/ljd/top/top_forest_sign_mobile.png?v=2" as const;

/** トップ：森の案内板（スマホ縦長・夜） */
export const HOME_FOREST_SIGN_MOBILE_BG_NIGHT_SRC =
  "/images/ljd/top/top_forest_sign_mobile_night.png?v=2" as const;

/** トップ：森の案内板（PC横長・昼） */
export const HOME_FOREST_SIGN_DESKTOP_BG_DAY_SRC =
  "/images/ljd/top/top_forest_sign_desktop.png?v=2" as const;

/**
 * トップ：森の案内板（PC横長・夜）
 * ※暫定：昼素材を暗くしたもの。専用イラストができたら差し替え。
 */
export const HOME_FOREST_SIGN_DESKTOP_BG_NIGHT_SRC =
  "/images/ljd/top/top_forest_sign_desktop_night.png?v=1" as const;

/** @deprecated 互換。昼のスマホ背景 */
export const HOME_FOREST_SIGN_MOBILE_BG_SRC = HOME_FOREST_SIGN_MOBILE_BG_DAY_SRC;

/** @deprecated 互換。昼のPC背景 */
export const HOME_FOREST_SIGN_DESKTOP_BG_SRC = HOME_FOREST_SIGN_DESKTOP_BG_DAY_SRC;

/** 森の案内板：右向きフクロウ先生（切り株前に重ねる） */
export const HOME_FOREST_SIGN_OWL_TEACHER_SRC =
  "/images/ljd/top/forest_sign_owl_teacher_facing_right.png" as const;

export const HOME_FOREST_SIGN_BG_BY_TIME = {
  mobile: {
    day: HOME_FOREST_SIGN_MOBILE_BG_DAY_SRC,
    night: HOME_FOREST_SIGN_MOBILE_BG_NIGHT_SRC,
  },
  desktop: {
    day: HOME_FOREST_SIGN_DESKTOP_BG_DAY_SRC,
    night: HOME_FOREST_SIGN_DESKTOP_BG_NIGHT_SRC,
  },
} as const;
