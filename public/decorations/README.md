# ページ装飾用挿絵

`src/lib/decorations/catalog.ts` のパスと一致するファイル名で配置してください。

## 優先（実装済みの参照先）

| ファイル | 用途 |
|----------|------|
| `forest-guide-station-md.webp` | `/help/ljd`（森の案内所）タイトル横 |
| `owl-sensei-md.webp` | `/diary-guide` タイトル横 |
| `owl-sensei-sm.webp` | マイページ「使い方を見る」カード |
| `leaf-sm.webp` | `/diary-guide` 章区切り |

## 将来追加

- `book-open-sm.webp`
- `moon-sm.webp`
- `footprints-sm.webp`

## 仕様の目安

- 透過背景、WebP 推奨（5〜30KB 程度）
- 表示サイズの約 2 倍の解像度で書き出し

## 仮画像

開発用に `owl-sensei-*.png` を同梱している場合があります。本番用 WebP を置いたら PNG は削除して構いません。catalog の `src` は `.webp` のままです。
