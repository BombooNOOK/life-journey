# あしあとブック画像アセット

差し替え後は `src/lib/journal/coverAssets.ts` / `ashiatoPageTemplates.ts` の `ASSET_VERSION` を +1 してください。

## 表紙（キャラ共通・1枚）

- `ashiato_cover_mori_standard.png` … 森のあしあと（旧 casual 流用）
- `ashiato_cover_komorebi.png` … こもれび
- `ashiato_cover_mori_irodori.png` … 森の彩り（旧 kireime 流用）

## 本文・レイヤー型（案A）

各テンプレ:

- `ashiato_template_{id}_background.png`
- `ashiato_template_{id}_photo_overlay.png` … 写真の上に重ねる枠
- `ashiato_template_{id}_preview.png` … 背景+枠の合成（一覧・大きく見る用）

対象 ID: `mori_enikki` / `mori_yohaku_note`

プレビュー再合成: `node scripts/compose-ashiato-template-previews.mjs`

## 本文・すうじ系（キャラ別・1枚完結）

```
ashiato_template_suuji_standard_{slug}.png
ashiato_template_suuji_irodori_{slug}.png
```

slug:

- `drfukuro`（フクロウ）
- `harinezumi`（ハリネズミ）
- `namakemono`（ナマケモノ）
- `risu`（リス）
- `kerosion`（ケロシオン）

一覧プレビュー:

- 標準: `ashiato_template_suuji_standard_drfukuro.png`
- 彩り: `ashiato_template_suuji_irodori_drfukuro.png`
