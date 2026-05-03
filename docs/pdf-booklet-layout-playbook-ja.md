# 鑑定書 PDF：レイヤー・ヘッダー・背景の再発防止メモ

軽量版と印刷用を分ける・画像を差し替えるときに、同じ詰まり方をしないための共有メモです。

## 1. `PdfPageFrame`（@react-pdf）の「絶対に壊しやすい」点

### `fixed` のヘッダーは **本文より前** に置く

- **NG**: `pageBody` の**後ろ**に `showHeader`（`fixed`）を移す → **ヘッダー全体が消える**ことがある（タイトル・横線・右上番号すべて）。
- **OK**: 背景用 `fixed` View（`zIndex: -10`）のあと、**すぐ** `pageHeader`（`fixed`）、そのあと `pageBody`、最後に右上フロートのページ番号（該当時）。
- 理由: react-pdf のレイアウト／描画順に依存。**DOM 順をいじると再現性なく消える**ので、レイヤー調整だけに留める。

### ページ番号（右上）

- ヘッダー**あり**の通常ページ: タイトル行右の **`pageHeaderPageNumberWrap`（absolute）** 内の `RawText` + `render`。親の `RawText` に `fixed` を付けるとページ座標に飛ぶので付けない。
- 全面画像ページ: `RawText` + `fixed` + `pageNumberOverlayFullBleed`。

### z-index を盛りすぎない

- 背景: `-10` 程度で十分なことが多い。
- ヘッダーが消えたら **まず DOM 順を疑う**。z-index だけ上げてヘッダーを本文の後ろに回すのは避ける。

---

## 2. 背景 PNG の「透明化」（帯ヘッダーが画像に隠れるとき）

帯ヘッダーと重なる **画像上端の明地**をアルファで抜く。実装は `scripts/transparentizeCoreFirstPageHeaderBand.py`（Pillow）。

### npm スクリプト（コア1枚目）

| コマンド | 対象 PNG |
|----------|-----------|
| `npm run fix:lp-bg-header` | `haikei-lp.png` |
| `npm run fix:destiny-bg-header` | `destiny-first-page.png` |
| `npm run fix:soul-bg-header` | `soul-first-page.png` |
| `npm run fix:personality-bg-header` | `personality-first-page.png` |
| `npm run fix:birthday-bg-header` | `birthday-first-page.png` |
| `npm run fix:maturity-bg-header` | `maturity-first-page.png` |

### 目次・本文続きの地

| コマンド | 対象 PNG |
|----------|-----------|
| `npm run fix:toc-continuation-bg-header` | `haikei-kekka2.png`（`CustomerPage` の `firstPageBodyBackgroundSrc` および続きページの地） |

差し替えたら **必ず該当コマンドを再実行**（上書き保存）。

### 上端帯が透明かざっと確認（Python）

リポジトリルートで:

```bash
python3 - <<'PY'
from pathlib import Path
from PIL import Image
p = Path("src/components/pdf/assets/haikei-kekka2.png")
im = Image.open(p).convert("RGBA")
w, h = im.size
band = min(120, int(h * 0.12))
px = im.load()
s = sum(px[x, y][3] for y in range(min(band, h)) for x in range(w))
print(p.name, "avg_alpha_top_band", round(s / (min(band, h) * w), 2))
PY
```

- **平均アルファが 0 に近い** → 上端帯はだいたい抜けている（現状の `haikei-kekka2.png`・各コア1枚目はこの状態）。
- **200 前後** → 不透明寄り。**見開き**の `spread-left.png` / `spread-right.png` は現状こちら。`showBindingBackground` でヘッダーが被るなら、同スクリプトを**別名バックアップ後**に試すか、デザイン側で上端を抜いた PNG を渡す。

---

## 3. 将来：軽量版と印刷用でアセットを分けるとき

1. **両方のツリー**に対し、`pdfAssetPaths.ts`（または別ファイル）のパスを分ける。
2. **それぞれ**で「上端帯の透明化」と「`PdfPageFrame` の子順」をチェックリスト化する。
3. 解像度は `.cursor/rules/numerology-pdf-booklet.mdc` の解像度表に合わせ、低解像度だけ先に出す場合は **ヘッダー帯の見え方**を必ず目視。
4. Blob キャッシュや CDN がある場合、**古い PDF が残らない**ようキャッシュキー／`cache={false}` の方針を揃える（`CoverPage` 等は既に `Image cache={false}`）。

---

## 4. 目次の右列の数字

- `CustomerPage.tsx` は手入力。**物理ページと「表紙を除く読者向け番号」の対応**は `PdfPageFrame` の `formatReaderPageLabel` / `displayPageAndTotal` と一致させる。
- PDF のページ順を変えたら **目次の数字も更新**。

---

## 5. 困ったときの順番

1. ヘッダーが消えた → **`PdfPageFrame` で `showHeader` が `pageBody` より前か**確認。
2. ヘッダーはあるが薄い／隠れる → **該当背景 PNG の上端アルファ**を確認 → `npm run fix:…-bg-header`。
3. それでもダメ → `getRedirectResult` や Cookie ではなく **PDF 専用**のこのファイルと `numerology-pdf-booklet.mdc` を見直す。
