# BambooNOOKの森・案内図（単独ページ）

`/help/forest-map` で使う1枚絵です。建物はすべてこのPNGに描き込みます。

## 置くファイル（案内図本体）

| ファイル | 用途 |
|----------|------|
| `bamboo_nook_forest_map.png` | 案内図本体・昼（576×1024） |
| `bamboo_nook_forest_map_night.png` | 案内図本体・夜（576×1024） |

パス例:

```text
public/images/ljd/forest-map/bamboo_nook_forest_map.png
public/images/ljd/forest-map/bamboo_nook_forest_map_night.png
```

どんぐり売店も他の建物と同様、上記1枚絵に含めてください。

## 売店ページの挿絵（別）

単独屋台イラストは案内図ではなく、売店ページ用です。

```text
public/images/ljd/donguri/donguri_stall.png
```

## 差し替え後に更新するもの

1. 画像の実ピクセル → `src/lib/help/forestMapAssets.ts` の `FOREST_MAP_INTRINSIC`
2. タップ領域 → `src/lib/help/forestMapHotspots.ts` の `FOREST_MAP_HOTSPOTS`
3. 行き先 → `src/lib/help/forestMapDestinations.ts`
4. キャッシュ更新 → `FOREST_MAP_ASSET_VERSION` を +1

開発時のタップ領域確認: `/preview/forest-map/layout`

## 行き先メモ

| スポット | 行き先 |
|----------|--------|
| ログハウス | `/orders` |
| 森のシアター | 準備中（ミニムービー・どんぐり広告） |
| 森のショップ | 準備中（クマ店長・どんぐり交換） |
| どんぐり売店 | `/help/donguri-stall`（購入は準備中） |
| 音楽堂 | `/help/music-hall` |
| てしごと屋 | BASE カテゴリ（外部・ハンドメイド） |
| 鑑定のへや | 状態に応じて分岐 |
| 森の案内所 | `/help/ljd` |
| 森の入口 | `/` |
