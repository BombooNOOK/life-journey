/**
 * 今日の3コマあしあと：写真ソースとコマへの配置
 * - main = あしあとに残した本編写真（必須・少なくとも1コマで使う）
 * - extra0 / extra1 = メーカーで追加する写真（任意・最大2枚）
 */

export const MORI_3KOMA_PHOTO_SOURCE_IDS = ["main", "extra0", "extra1"] as const;

export type Mori3komaPhotoSourceId = (typeof MORI_3KOMA_PHOTO_SOURCE_IDS)[number];

/** 上・中・下コマそれぞれがどのソースを使うか */
export type Mori3komaPanelAssignment = [
  Mori3komaPhotoSourceId,
  Mori3komaPhotoSourceId,
  Mori3komaPhotoSourceId,
];

export const MORI_3KOMA_PANEL_LABELS = ["1コマ目（上）", "2コマ目（中）", "3コマ目（下）"] as const;

export const MORI_3KOMA_SOURCE_LABELS: Record<Mori3komaPhotoSourceId, string> = {
  main: "あしあとの写真",
  extra0: "追加写真 1",
  extra1: "追加写真 2",
};

/** 初期は本編写真を3コマすべてに（従来どおり）。追加後に配置を変えられる */
export const DEFAULT_MORI_3KOMA_PANEL_ASSIGNMENT: Mori3komaPanelAssignment = [
  "main",
  "main",
  "main",
];

export function isMori3komaPhotoSourceId(value: string): value is Mori3komaPhotoSourceId {
  return (MORI_3KOMA_PHOTO_SOURCE_IDS as readonly string[]).includes(value);
}

export function parseMori3komaPanelAssignment(
  raw: string | null | undefined,
): Mori3komaPanelAssignment | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length !== 3) return null;
  if (!parts.every(isMori3komaPhotoSourceId)) return null;
  const assignment = parts as Mori3komaPanelAssignment;
  if (!mori3komaAssignmentIncludesMain(assignment)) return null;
  return assignment;
}

export function serializeMori3komaPanelAssignment(assignment: Mori3komaPanelAssignment): string {
  return assignment.join(",");
}

export function mori3komaAssignmentIncludesMain(assignment: Mori3komaPanelAssignment): boolean {
  return assignment.includes("main");
}

/**
 * 指定コマのソースを変更。本編がゼロコマになる変更は拒否して元を返す。
 */
export function assignMori3komaPanel(
  assignment: Mori3komaPanelAssignment,
  panelIndex: 0 | 1 | 2,
  sourceId: Mori3komaPhotoSourceId,
): Mori3komaPanelAssignment {
  const next: Mori3komaPanelAssignment = [...assignment];
  next[panelIndex] = sourceId;
  if (!mori3komaAssignmentIncludesMain(next)) return assignment;
  return next;
}

export function mori3komaUsesExtraSource(assignment: Mori3komaPanelAssignment): boolean {
  return assignment.some((id) => id === "extra0" || id === "extra1");
}
