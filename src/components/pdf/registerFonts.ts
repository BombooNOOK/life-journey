import { Font } from "@react-pdf/renderer";

let registered = false;

// 日本語PDFで英語用の自動ハイフネーションが走らないよう、グローバルに無効化する
Font.registerHyphenationCallback((word: string) => [word]);

// サーバレス（Vercel Functions）では `node_modules/.../files` が出力追跡の都合で切り落とされることがあるため、
// 実行時にfs探索せず、ビルド時にフォントファイルを静的importして確実に同梱させます。
//
// どのsubsetかは環境差がありますが、ここでは「1」subsetを優先して使います。
import woff2_1_400 from "@fontsource/noto-sans-jp/files/noto-sans-jp-1-400-normal.woff2";
import woff2_1_700 from "@fontsource/noto-sans-jp/files/noto-sans-jp-1-700-normal.woff2";

export function ensureJapaneseFont(): void {
  if (registered) return;

  Font.register({
    family: "NotoSansJP",
    fonts: [
      { src: woff2_1_400, fontWeight: 400 },
      { src: woff2_1_700, fontWeight: 700 },
    ],
  });
  registered = true;
}
