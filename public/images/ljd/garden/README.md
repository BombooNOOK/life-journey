# お庭（Garden）アセット

配置先: `public/images/ljd/garden/`

コード参照: `src/lib/garden/gardenAssets.ts`

すべて **透過 PNG** 推奨（背景 `garden.png` のみ不透過でOK）。

## 必須（MVP）

### お庭背景

| ファイル名 | 用途 | サイズ |
|------------|------|--------|
| `garden.png` | モバイル没入・PCカード背景 | **576×1024** |

### 植物の成長イラスト（10段階）

| ファイル名 | 水やり累計の目安 |
|------------|------------------|
| `plant_default_stage_01.png` | 0〜2 回 |
| `plant_default_stage_02.png` | 3〜5 回 |
| `plant_default_stage_03.png` | 6〜8 回 |
| `plant_default_stage_04.png` | 9〜11 回 |
| `plant_default_stage_05.png` | 12〜14 回 |
| `plant_default_stage_06.png` | 15〜17 回 |
| `plant_default_stage_07.png` | 18〜20 回 |
| `plant_default_stage_08.png` | 21〜23 回 |
| `plant_default_stage_09.png` | 24〜27 回 |
| `plant_default_stage_10.png` | **28 回以上（満開）** |

- 番号は **必ず 2桁**（`01`〜`10`）
- 推奨 **480×480**・透過PNG

### ジョウロ / 行き先アイコン

| ファイル名 | 用途 |
|------------|------|
| `garden_watering_can.png` | 水やり（モバイルはタップ対象） |
| `garden_water_can_pose.png` | 水やり演出：通常ポーズ |
| `garden_water_pouring.png` | 水やり演出：お水が出ている |
| `garden_destination_icon.png` | おでかけ「お庭に出る」カード |

## 配置調整

- モバイル植木鉢・ジョウロ位置: `src/lib/garden/gardenMobileLayout.ts`
