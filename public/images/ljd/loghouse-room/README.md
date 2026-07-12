# ログハウス室内UIアセット

`src/lib/loghouse/logHouseRoomAssets.ts` のパスと一致するファイル名で配置してください。

## 背景

| ファイル | 用途 | サイズ |
|----------|------|--------|
| `loghouse_room_mobile.png` | 室内背景・昼（家具なし） | 576×1024 px |
| `loghouse_room_mobile_night.png` | 室内背景・夜（家具なし） | 576×1024 px |
| `loghouse_room_sample_all_parts.png` | 全パーツ配置の見本（座標合わせ用） | 576×1024 px |

時間帯の切り替えは端末ローカル時刻（`src/lib/loghouse/logHouseRoomTimeTheme.ts`）。
昼 5:00〜17:59 / 夜 18:00〜4:59（定数で調整可）。
表示設定（`/orders/settings/display`）で「自動 / 昼 / 夜」を選べます（既定は自動・localStorage）。

## パーツ（透過 PNG）

| ファイル | 用途 |
|----------|------|
| `loghouse_bookshelf.png` | 本棚（タップ可） |
| `loghouse_desk.png` | 机（タップ可） |
| `loghouse_resident_card.png` | 壁の住民票（タップ可） |
| `loghouse_today_result.png` | 今日の鑑定結果（タップ可） |
| `loghouse_radio.png` | ラジカセ（タップ可） |
| `loghouse_rabbit.png` | 分身うさぎ・立ち |
| `loghouse_rabbit_blink.png` | 分身うさぎ・瞬き |
| `loghouse_rabbit_walk_left.png` | 分身うさぎ・左向き歩き |
| `loghouse_rabbit_walk_right.png` | 分身うさぎ・右向き歩き |
| `loghouse_chair.png` | 椅子とテーブル（見た目のみ・タップなし） |

## 座標調整

- パーツの重ね位置：`src/lib/loghouse/logHouseRoomLayout.ts`
- タップ領域：`src/lib/loghouse/logHouseRoomHotspots.ts`
- **レイアウト定規（開発時）**：`/preview/loghouse-room/layout`

サンプル画像 `loghouse_room_sample_all_parts.png` を見ながら `%` を調整します。
