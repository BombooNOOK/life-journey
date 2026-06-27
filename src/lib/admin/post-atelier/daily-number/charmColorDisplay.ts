/** 画像合成用のおまもりカラー短縮表記（CSV・キャプションの正式名はそのまま） */
const CHARM_COLOR_IMAGE_LABELS: Record<string, string> = {
  "オレンジ・茶色": "橙・茶",
  "紺・藍色": "紺・藍",
  レインボー: "虹",
  黄色: "黄",
};

export function formatCharmColorForImage(colorName: string): string {
  const normalized = colorName.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return CHARM_COLOR_IMAGE_LABELS[normalized] ?? normalized;
}
