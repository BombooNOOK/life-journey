# device_movie_basic（森の映写便り）素材

配置: `public/images/ljd/mori-log/device-movie-basic/`

| ファイル | 用途 |
|---|---|
| `background-lantern.png` | 背景＋ランタン小物 |
| `background-owl.png` | 背景＋フクロウ小物 |
| `background-quill.png` | 背景＋羽ペン小物 |
| `foreground-overlay.png` | 前面フレーム・テープ（真のアルファ） |

## 素材確認メモ（2026-08-06）

- 元データはいずれも **819×1024**（縦横比 ≈0.7998 ≈ 4:5）
- 背景3種は動画枠・タイトル枠の座標が一致（小物部分のみ差分）
- 制作室納品の `foreground-overlay` は **RGB・実質 JPEG（jfif）** で、
  動画窓が黒塗り・アルファ無しだった
- プロジェクト配置時に黒（R,G,B ≤ 8）を透明化した **RGBA PNG** を生成済み
  （ランタイムのクロマキーは行わない）

正規化レイアウト定義は `src/lib/journal/moriLog/deviceMovieBasicTemplate.ts` を参照。
