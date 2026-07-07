# ページ装飾用挿絵

`src/lib/decorations/catalog.ts` のパスと一致するファイル名で配置してください。

## 優先（実装済みの参照先）

| ファイル | 用途 |
|----------|------|
| `forest-guide-station-md.webp` | `/help/ljd`（森の案内所）タイトル横 |
| `forest-direction-sign-left.png` | 行き先看板（左向き・1024×1024） |
| `forest-direction-sign-right.png` | 行き先看板（右向き・1024×1024）／鑑定のへや案内 |
| `forest-direction-sign.png` | （旧）行き先看板。新素材では未使用 |
| `first-visit-resident-registration-owl-frame.png` | `/guide/first/register` 森の住民登録・フクロウコメント枠 |
| `kantei-hall-md.png` | （旧）鑑定のへや案内カード |

## 初回導線・案内図（`public/images/ljd/first-visit/`）

| ファイル | 用途 |
|----------|------|
| `welcome/bg_map_mobile.png` | 森へようこそ（モバイル・フクロウコメント枠込み） |
| `welcome/bg_map_desktop.png` | 森へようこそ（PC・フクロウコメント枠込み） |
| `forest-guide/forest_guide_map_mobile.png` | 森の案内図（モバイル・地図のみ） |
| `forest-guide/forest_guide_map_desktop.png` | 森の案内図（PC・地図のみ） |

## 森の建物単独（`public/images/ljd/first-visit/buildings/`）

| ファイル | 用途 |
|----------|------|
| `forest_building_loghouse.png` | ログハウス（移動演出用） |
| `forest_building_guide_station.png` | 森の案内所 |
| `forest_building_kantei_hall.png` | 鑑定のへや |
| `forest_building_music_hall.png` | 森の小さな音楽堂 |
| `forest_building_handicraft_shop.png` | 森のてしごと屋 |
| `../loghouse-complete.jpg` | ログハウス完成（完成画面専用） |
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
