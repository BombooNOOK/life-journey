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

現状の `foreground-overlay.png`（リポジトリ配置物）を再検査すると:

- 形式は **PNG RGBA**（JPEG化されていない）
- **窓内部は alpha=0**（真に抜けている）
- 半透明ピクセルは **0**
- 一方で **不透明の暗いピクセル**が縁付近に残存（窓枠周辺の opaque dark）
  → Canva 納品の「真の透過」とは別系統の、過去の黒マット→透過変換の名残である可能性が高い
- チャット添付の「同じ見た目」ファイルは、転送時に **JPEG化・アルファ消失**していた（参照差し替え不可）

実装経路（要約）:

- 参照パスは常に `deviceMovieBasicForegroundPath()` → 上記 PNG のみ
- `loadImage` は `new Image()`（JPEG flatten なし）
- オーバーレイ自体の JPEG 化処理はなし
- エンコード用 Canvas は `alpha: false` だが、これは **出力動画が不透明**なだけで、
  `drawImage(overlay)` 時のソース透明は下地へ正しく合成される（透明→黒塗りにはならない）
- ランタイムの黒除去／クロマキーは残していない

**真の透過PNGを差し替えるとき**: Finder 等でこのパスへ直接上書き（チャット経由は避ける）。  
問題なければ `DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX = 0` に戻す。

## 応急: 角の黒ギザ対策

黒マット焼き直し透過の角にギザ・黒縁が残る場合:

1. 動画クリップを窓より内側へ縮める（`DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX`、既定 5）
2. 窓とクリップの差分を生成り色（`DEVICE_MOVIE_BASIC_VIDEO_MATTE_COLOR`）で塗る
3. 前面オーバーレイは動画・内枠の上にそのまま重ねる

**真の透過PNGへ差し替えたら** `DEVICE_MOVIE_BASIC_VIDEO_EDGE_PAD_DESIGN_PX = 0` にする。  
内枠幅も 0 になり、クリップ枠は窓と一致する。

正規化レイアウト定義は `src/lib/journal/moriLog/deviceMovieBasicTemplate.ts` を参照。
