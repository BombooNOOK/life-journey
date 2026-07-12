# 案内所の案内図（旧画風）

案内所（`/help/ljd` など）の `BambooForestGuideMap` で使います。

## 使うファイル

| ファイル | 用途 |
|----------|------|
| `forest_guide_map_mobile.png` | 縦長案内図（576×1024）。**PC でもこの1枚を共用** |

パス:

```text
public/images/ljd/first-visit/forest-guide/forest_guide_map_mobile.png
```

※ `forest_guide_map_desktop.png`（旧・横長）は未使用です。削除して問題ありません。

## タップ領域

建物の位置は単独案内図と同じなので、`src/lib/help/forestMapHotspots.ts` の `FOREST_MAP_HOTSPOTS` を流用しています。

画像差し替え後は `src/lib/help/bambooForestGuideMap.ts` の `BAMBOO_FOREST_GUIDE_MAP_ASSET_VERSION` を +1 してください。
