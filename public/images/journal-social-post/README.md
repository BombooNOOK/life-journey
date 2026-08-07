# SNS 投稿画像用テンプレート / 森ログメーカー

## 既存（伴走キャラ別）

| ファイル | 用途 |
|---------|------|
| `sns02-template-base-{slug}.png` | ひだまりフォト・下地 |
| `sns02-template-photo-overlay.png` | ひだまりフォト・写真上装飾 |
| `sns03-template-base-{slug}.png` | 森のスクラップ・下地 |

## 森ログあしあと（今回追加）

### 5:4（819×1024 → 出力 1080×1350）

| ファイル | テンプレ |
|---------|---------|
| `mori_log_5x4_chiisana_ashiato_full.png` | ちいさなあしあと（1枚完結） |
| `mori_log_5x4_kyou_no_ashiato_bg.png` / `_overlay.png` | 今日のあしあと |
| `mori_log_5x4_odekake_ashiato_bg.png` / `_overlay.png` | おでかけあしあと |
| `mori_log_5x4_oishii_ashiato_bg.png` / `_overlay.png` | おいしいあしあと |
| `mori_log_5x4_totteoki_no_ashiato_bg.png` / `_overlay.png` | とっておきのあしあと |

### 16:9 縦＝9:16（576×1024 → 出力 1080×1920）

| ファイル | テンプレ |
|---------|---------|
| `mori_log_16x9_kyou_no_ashiato_wide_bg.png` / `_overlay.png` | 今日のあしあと（ワイド） |
| `mori_log_16x9_kyou_no_3koma_ashiato_bg.png` / `_overlay.png` | 今日の3コマあしあと |

## 選び用サムネ（デザイン一覧）

本番と同じ合成（背景→写真→オーバーレイ→文字）で作った見本です。

| パターン | 例 |
|---------|-----|
| `*_picker_preview.jpg` | `mori_log_5x4_kyou_no_ashiato_picker_preview.jpg` |

再生成: `npx tsx scripts/compose-mori-log-picker-previews.ts`

## 合成順

### 1枚完結
1. `*_full.png`
2. 写真・文字

### 2枚構成
1. `*_bg.png`
2. 写真（3コマは同一写真を3枠へ・将来複数枚対応）
3. `*_overlay.png`（**真の透過 RGBA**。設計サイズまたは出力サイズどちらでも可。読込時に設計サイズへリサイズ）
4. 文字

定義・座標は `src/lib/journal/social-post-image/templates.ts` と `moriAshiatoTemplates.ts`。
`photoOverlayPrepare` はアルファ無し素材向けの白→透明フォールバックを残しているが、現行 overlay は `hasAlpha` でそのまま通過する。
