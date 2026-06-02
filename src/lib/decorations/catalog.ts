/**
 * ページ装飾用の挿絵カタログ。
 * 画像差し替え: `public/decorations/` の同名ファイルを上書きするか、src を変更。
 */
export type DecorationAssetEntry = {
  /** 本番用（差し替え先） */
  src: string;
  /** 開発用 PNG 仮画像。WebP 未配置時に onError で試す */
  placeholderSrc?: string;
  width: number;
  height: number;
};

export const decorationAssets = {
  "owl-md": {
    src: "/decorations/owl-sensei-md.webp",
    placeholderSrc: "/decorations/owl-sensei-md.png",
    width: 72,
    height: 72,
  },
  "owl-sm": {
    src: "/decorations/owl-sensei-sm.webp",
    placeholderSrc: "/decorations/owl-sensei-sm.png",
    width: 48,
    height: 48,
  },
  "leaf-sm": {
    src: "/decorations/leaf-sm.webp",
    width: 32,
    height: 32,
  },
  /** 将来追加用（ファイル未配置でも型として予約） */
  "book-sm": {
    src: "/decorations/book-open-sm.webp",
    width: 40,
    height: 40,
  },
  "moon-sm": {
    src: "/decorations/moon-sm.webp",
    width: 36,
    height: 36,
  },
  "footprints-sm": {
    src: "/decorations/footprints-sm.webp",
    width: 48,
    height: 24,
  },
} as const satisfies Record<string, DecorationAssetEntry>;

export type DecorationName = keyof typeof decorationAssets;

export function getDecorationAsset(name: DecorationName): DecorationAssetEntry {
  return decorationAssets[name];
}
