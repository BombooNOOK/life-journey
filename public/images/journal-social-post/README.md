# SNS 投稿画像用テンプレート

| ファイル | 用途 |
|---------|------|
| `sns02-template-base-drfukuro.png` | 角丸横長・下地（フクロウ先生） |
| `sns02-template-base-harinezumi.png` | 角丸横長・下地（ハリネズミくん） |
| `sns02-template-base-namakemono.png` | 角丸横長・下地（ナマケモノくん） |
| `sns02-template-base-risu.png` | 角丸横長・下地（リスくん） |
| `sns02-template-base-kerosion.png` | 角丸横長・下地（ケロシオン） |
| `sns02-template-photo-overlay.png` | 角丸横長・写真上装飾（付箋・**全キャラ共通**・透明 PNG） |
| `sns02-template-base.png` | 旧名（drfukuro と同内容・互換用） |
| `sns03-template-base-drfukuro.png` | スクエア・ポラロイド・下地（フクロウ先生） |
| `sns03-template-base-harinezumi.png` | スクエア・ポラロイド・下地（ハリネズミくん） |
| `sns03-template-base-namakemono.png` | スクエア・ポラロイド・下地（ナマケモノくん） |
| `sns03-template-base-risu.png` | スクエア・ポラロイド・下地（リスくん） |
| `sns03-template-base-kerosion.png` | スクエア・ポラロイド・下地（ケロシオン） |
| `sns03-template-blank.png` | 旧・共通下地（互換用・drfukuro と同内容） |
| `sns02-template-sample.png` | 文字入り参考（sns02） |
| `sns03-template-sample.png` | 文字入り参考（sns03） |

## sns03 の合成順

1. `sns03-template-base-{キャラslug}.png`（下地・伴走キャラで自動切替）
2. ユーザーの写真（正方形 400×400）
3. 文字（コード側）

写真枠は正方形のため、sns02 と違い photo-overlay はありません。

## sns02 の合成順

1. `sns02-template-base-{キャラslug}.png`（下地・伴走キャラで自動切替）
2. ユーザーの写真（角丸）
3. `sns02-template-photo-overlay.png`（付箋など・共通）
4. 文字・顔アイコン（コード側）

キャラ slug は日記ブックと同じ: `drfukuro` / `harinezumi` / `namakemono` / `risu` / `kerosion`

出力サイズは Instagram 用に 1080×1350 に拡大します。

文字位置の調整は `src/lib/journal/social-post-image/templates.ts` を編集してください。

Canva から書き出すときは **PNG（背景透過）** を選んでください。白背景 JPEG だと写真が隠れます（コード側で白→透明の救済あり）。
