/**
 * Life Journey Diary｜Hybrid Phase 4B-2C Server→Device Journal Migration PoC
 *
 * Status: Working Notes (not Product SoT)
 * Base: feat/local-first-journal-repository-poc @ 487e00c
 * Branch: feat/server-to-device-journal-migration-poc
 */

# Hybrid Phase 4B-2C｜Server → Device Read-only Migration PoC

## 目的

Web版サーバーに保存されたあしあと **1件** を、認証済みAPI経由で端末へ **コピー**する。  
サーバー原本は更新・削除・ownership変更しない。Local原本化もしない（`source=migrated_server` の控え）。

## migration source

| 項目 | 値 |
| --- | --- |
| Entry | `GET /api/journal/[id]` |
| Photo | `GET /api/journal/entries/[entryId]/photo`（legacy JSON data URL も受理） |
| Neon直SQL | **不使用** |
| 新PoC API | **未追加**（既存で十分） |

## auth path

- Cookie session（`lj_*` / Firebase viewer cookie）
- 認可: `where: { id, email: viewerEmail }` → 他人IDは 404
- Native へ `DATABASE_URL` / Neon / Blob private / Firebase admin を埋め込まない

テストデータ: 管理者／テストアカウントが本人作成した架空あしあと1件。エージェントはメール／パスワードを扱わない。

## mapping

`mapServerJournalEntryLikeToLocal` を実APIレスポンスへ適用。

| Local | 設定 |
| --- | --- |
| `stableId` | 新規ULID |
| `legacyServerId` | server cuid |
| `source` | `migrated_server` |
| `localStatus` | `active` |
| `importedAt` | 端末コピー時刻 |
| `serverUpdatedAt` | server `updatedAt`（将来差分用。競合解決未実装） |
| `diaryNumbers` | **Local原本に保存しない**（再計算可能） |

title列がない場合: content先頭行／タグ除去後の先頭から PoC title を派生。

## ULID / legacyServerId / dedupe

再移行時は `findByLegacyServerId` → 既存があれば **新規ULIDなし**・`already_present`。  
SQLite: partial unique index on `legacy_server_id`（schema user_version=2）。

## media download / checksum

1. 認証APIで bytes または legacy data URL 取得  
2. SHA-256  
3. `Directory.Library` + `ljd/media/journal/...` へ書き込み（relative pathのみDB保存）  
4. **Filesystemから再読込して checksum一致を確認**  
5. Vercel Blob URLを人生原本参照として残さない

## staging

```
dedupe → server fetch → validate → media download → checksum
  → write media → re-read verify → map → SQLite save
  → Local getById confirm
```

失敗時:
- PHOTO失敗 → entry未保存
- SQLite失敗 → 書いたmediaを削除（best-effort）

**Transaction化の限界:** Capacitor SQLite と Filesystem は別系統のため、単一ACIDは不可。本PoCは **論理ユニット＋ロールバック**。

## persistence / offline

- Remote shell: `/preview/local-first-lab`（devのみ・cookie認証）
- Offline: `cap:sync:ios:lab` の capacitor-www Lab が同一SQLite＋FSを読む
- 表示はサーバー再fetchではない旨をUIに明示

## size（1entry計測欄）

Labが `contentChars` / `metaApproxBytes` / `photoBytes` / `relativePath` / checksum頭12桁を表示。  
将来の100件・1000件・5年概算の素材。個人本文はログ・報告しない。

## failure safety

| Case | 期待 |
| --- | --- |
| A 存在しないID | NOT_FOUND、Local不変 |
| B 他者のID | 404（認可コード監査。実他人IDで試験しない） |
| C 写真失敗 | PHOTO_FAILED、半端entryなし |
| D SQLite失敗 | media削除、サーバー不変 |

## server untouched

コピーのみ。終了後ユーザーが通常LJDで対象entryの残存・未改変を確認。エージェントは本番削除しない。Local cleanupは端末PoC削除ボタン。

## next step

- 正式候補へ進めるか（A/B）は Simulator本検証後に最終判定
- 複数件migrationより先に、PoC cleanup＋Local基盤のmain化検討も候補
