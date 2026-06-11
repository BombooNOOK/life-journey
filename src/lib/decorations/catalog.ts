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
  "risu-kun-sm": {
    src: "/decorations/risu-kun-sm.webp",
    placeholderSrc: "/decorations/risu-kun-sm.png",
    width: 44,
    height: 54,
  },
  "acorn-sm": {
    src: "/decorations/acorn-sm.webp",
    placeholderSrc: "/decorations/acorn-sm.png",
    width: 22,
    height: 24,
  },
  /** トップ「こんな方におすすめ」会話形式（全身イラスト・表示は sm スケール想定） */
  "character-owl-gentle": {
    src: "/decorations/characters/character-owl-gentle.png",
    width: 40,
    height: 48,
  },
  "character-sloth-worried": {
    src: "/decorations/characters/character-sloth-worried.png",
    width: 40,
    height: 48,
  },
  "character-squirrel-thinking": {
    src: "/decorations/characters/character-squirrel-thinking.png",
    width: 40,
    height: 48,
  },
  "character-hedgehog-worried": {
    src: "/decorations/characters/character-hedgehog-worried.png",
    width: 40,
    height: 48,
  },
  "character-kerosion-mystic": {
    src: "/decorations/characters/character-kerosion-mystic.png",
    width: 40,
    height: 48,
  },
  /** 会話用顔アイコン（丸背景コンポーネント内で object-fit 調整） */
  "character-owl-face": {
    src: "/decorations/characters/owl-face.png",
    width: 96,
    height: 96,
  },
  "character-sloth-face": {
    src: "/decorations/characters/sloth-face.png",
    width: 96,
    height: 96,
  },
  "character-squirrel-face": {
    src: "/decorations/characters/squirrel-face.png",
    width: 96,
    height: 96,
  },
  "character-hedgehog-face": {
    src: "/decorations/characters/hedgehog-face.png",
    width: 96,
    height: 96,
  },
  "character-kerosion-face": {
    src: "/decorations/characters/kero-face.png",
    width: 96,
    height: 96,
  },
} as const satisfies Record<string, DecorationAssetEntry>;

export type DecorationName = keyof typeof decorationAssets;

export function getDecorationAsset(name: DecorationName): DecorationAssetEntry {
  return decorationAssets[name];
}
