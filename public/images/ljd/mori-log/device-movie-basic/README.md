# device_movie_basic（森の映写便り）素材

配置: `public/images/ljd/mori-log/device-movie-basic/`

| ファイル | 用途 |
|---|---|
| `background-lantern.png` | 背景＋ランタン小物 |
| `background-owl.png` | 背景＋フクロウ小物 |
| `background-quill.png` | 背景＋羽ペン小物 |
| `foreground-overlay.png` | 前面フレーム・テープ |

パス参照: `deviceMovieBasicForegroundPath()` / `deviceMovieBasicBackgroundPath()`  
窓座標: `DEVICE_MOVIE_BASIC_LAYOUT_NORM.videoRect`

## 素材確認メモ（2026-08-06）

- 元データはいずれも **819×1024**（縦横比 ≈0.7998 ≈ 4:5）
- 背景3種は動画枠・タイトル枠の座標が一致（小物部分のみ差分）
- 制作室納品の `foreground-overlay` は当初 **RGB・実質 JPEG（jfif）** で、
  動画窓が黒塗り・アルファ無しだった
- プロジェクト配置時に黒（R,G,B ≤ 8）を透明化した **RGBA PNG** を生成済み
  （ランタイムのクロマキーは行わない。紙枠まで欠ける強い透明化はしない）

## 透過切り分け（2026-08-07）

開発のみ: `/preview/mori-log-device-movie/overlay-alpha`

- チャット貼付の PNG は JPEG 化・アルファ消失することがある → **Finder で直接上書き**
- 2026-08-07 差し替え後の `foreground-overlay.png`:
  - **1080×1350 / RGBA**
  - 窓中央・深部内部は alpha=0
  - **不透明の暗いピクセル = 0**（旧変換素材にあった縁黒ギザなし）
  - 半透明（ソフトな縁）はあり → Canva 由来のアンチエイリアスとして正常
- `DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX` は **0**（真の透過前提）

## 応急: 角の黒ギザ対策

黒マット焼き直し透過の角にギザ・黒縁が残る場合:

1. 動画クリップを窓より内側へ縮める（`DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX`、既定 5）
2. 窓とクリップの差分を生成り色（`DEVICE_MOVIE_BASIC_VIDEO_MATTE_COLOR`）で塗る
3. 前面オーバーレイは動画・内枠の上にそのまま重ねる

**真の透過PNGへ差し替えたら** `DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX = 0` にする。  
内枠幅も 0 になり、クリップ枠は窓と一致する。

正規化レイアウト定義は `src/lib/journal/moriLog/deviceMovieBasicTemplate.ts` を参照。
