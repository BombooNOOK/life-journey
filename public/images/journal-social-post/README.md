# SNS 投稿画像用テンプレート

| ファイル | 用途 |
|---------|------|
| `sns02-template-base.png` | 角丸横長・下地（819×1024） |
| `sns02-template-photo-overlay.png` | 角丸横長・写真上装飾（付箋など・**透明 PNG**） |
| `sns02-template-blank.png` | 角丸横長・旧一体型（参考用） |
| `sns03-template-blank.png` | スクエア・ポラロイド（819×1024） |
| `sns02-template-sample.png` | 文字入り参考（sns02） |
| `sns03-template-sample.png` | 文字入り参考（sns03） |

## sns02 の合成順

1. `sns02-template-base.png`（下地）
2. ユーザーの写真（角丸）
3. `sns02-template-photo-overlay.png`（付箋など）
4. 文字・顔アイコン（コード側）

出力サイズは Instagram 用に 1080×1350 に拡大します。

文字位置の調整は `src/lib/journal/social-post-image/templates.ts` を編集してください。

Canva から書き出すときは **PNG（背景透過）** を選んでください。白背景 JPEG だと写真が隠れます（コード側で白→透明の救済あり）。
