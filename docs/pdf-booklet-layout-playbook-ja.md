# 鑑定書 PDF：レイヤー・ヘッダー・背景の再発防止メモ

軽量版と印刷用を分ける・画像を差し替えるときに、同じ詰まり方をしないための共有メモです。

## 1. `PdfPageFrame`（@react-pdf）の「絶対に壊しやすい」点

### `fixed` のヘッダーは **本文より前** に置く

- **NG**: `pageBody` の**後ろ**に `showHeader`（`fixed`）を移す → **ヘッダー全体が消える**ことがある（タイトル・横線・右上番号すべて）。
- **OK**: 背景用 `fixed` View（`zIndex: -10`）のあと、**すぐ** `pageHeader`（`fixed`）、そのあと `pageBody`、最後に右上フロートのページ番号（該当時）。
- 理由: react-pdf のレイアウト／描画順に依存。**DOM 順をいじると再現性なく消える**ので、レイヤー調整だけに留める。

### ページ番号（右上）

- **必ず** `RawText` + **`fixed`** + `render` + `pageNumberOverlay`（または全面用 `FullBleed`）。**ページ末尾**に置く（ヘッダーはその前）。
- **NG（再発注意）**: `fixed` ヘッダー行の**内側**に、非 `fixed` の `RawText`+`render` で番号だけ置く → **数字が出ない**ことが多い（タイトル・横線は出る）。
- 横線と番号の重なりは、ヘッダー行の **`paddingRight`** で番号幅ぶん空ける（レイヤーで無理に隠さない）。

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

---

## 6. プレビュー（`quality=low`）と製本（`high`）で挙動が違うとき

### コード上の違い（高画質のロジックは変えない前提で読む）

- **`resolvePdfAssetPath`**（`pdfAssetPaths.ts`）: `quality=low` のときだけ `src/components/pdf/assets-preview/` に **同名**の PNG/JPEG があればそちらを使う。無ければ **`assets/` の本番解像度**にフォールバック。
- **`ReportPdfPages`**: 冒頭で `setPdfRenderQuality(renderConfig?.quality ?? "high")` を呼ぶ。遅いと `resolvePdfAssetPath` が **直前リクエストの quality** を見てしまうため、**関数先頭で必ずセット**する。
- **本文のフォント等**: `bodyTune` や `focusPage` が変わったときだけ `renderConfig` に追加プロパティが付く。`quality` だけでは `bodyStyleFromConfig` は変わらない（＝レイアウト差の主因ではないことが多い）。

### Blob キャッシュで「直したのにプレビューが変わらない」

- フル冊子（`focusPage=all` & `bodyTune=normal`）は Vercel Blob に **プレビュー用／製本用で別 URL** だが、**指紋 `buildOrderPdfCacheFingerprint` に `quality` は含まれない**（コメントどおり URL で分離）。
- **同じ注文データ**で一度キャッシュされた **プレビュー PDF** は、PDF 生成ロジックを直しても **DB の `pdfPreviewBlobUrl` が残っている限り再生成されない**ことがある（見た目が古いまま）。
- 対処の例: 該当注文のプレビュー Blob を消す／`ORDER_FULL_PDF_BLOB_CACHE_REVISION` を上げて指紋を無効化する（**製本側のキャッシュも同じリビジョンに依存する**点に注意）。

### 将来 `assets-preview` を全面差し替えするとき

- **解像度・縦横比**を `assets/` と揃えるか、react-pdf 側の `top`/`padding` を合わせ直す。
- **アルファ**（帯ヘッダー帯の透明化）を `assets/` と同じ手順で再確認（§2 のスクリプト）。
- 差し替え後は **必ずプレビュー Blob を再生成**して目視（キャッシュに古いプレビューが残りやすい）。

### 並行リクエスト（将来負荷が増えたとき）

- `getPdfRenderQuality` は **プロセス全体で 1 つのモジュール変数**。同時に複数の PDF 生成が走ると理論上は取り違え得る。**根本対策**は「quality を引数で `resolvePdfAssetPath` に渡す」などグローバル廃止（未着手なら playbook にだけ記録）。
