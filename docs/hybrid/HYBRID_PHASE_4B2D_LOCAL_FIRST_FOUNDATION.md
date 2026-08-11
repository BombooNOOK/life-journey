/**
 * Life Journey Diary｜Hybrid Phase 4B-2D Local-first Foundation
 *
 * Status: Working Notes (not Product SoT)
 * Base: feat/server-to-device-journal-migration-poc @ 2ccd4a5
 * Branch: refactor/local-first-foundation
 */

# Hybrid Phase 4B-2D｜PoC Cleanup ＋ Local-first基盤 正式昇格準備

## PoC差分の分類（棚卸し）

| ID | 分類 | 内容 |
| --- | --- | --- |
| A | 正式基盤 | Cap SQLite/FS deps、Privacy Manifest、`journal/*` foundation、mapper、repository、search、migrate helper、stableId、mediaStore |
| B | 形を整えて残す | schema名正式化、DB名 `ljd_local_journal`、diagnostics（旧Lab縮小）、scripts rename、transaction helper |
| C | 削除 | `poc/*`、`local_journal_poc`、acorn seed、`/preview/local-first-lab`、autorun query、旧Lab scripts |
| D | docs/tests | 4B-2A/B/C履歴docs、`__fixtures__`、mapper/checksum unit tests、本4B-2D doc、SoT実証メモ追記 |
| E | 保留 | encryption / Keychain / SQLCipher productization / bulk migration / Web閲覧専用化 |

## PoCで証明したこと（4B-2A〜2C）

- SQLite write/read、Filesystem write/read
- kill/relaunch persistence、Next停止 cold start
- Journal-like Local model（ULID `stableId` / `legacyServerId`）
- Server→Device **1件** copy（認証済みAPI、server untouched）
- 写真 copy ＋ SHA-256、`legacyServerId` dedupe

## 正式基盤へ残すもの

| 領域 | 内容 |
| --- | --- |
| SQLite | `@capacitor-community/sqlite`、open/close、`PRAGMA user_version`、transaction helper |
| Tables | `local_journal_entries` / `local_journal_tags` / `local_media`（Web schema丸コピー禁止） |
| DB name | `ljd_local_journal`（Library/CapacitorDatabase） |
| Filesystem | `@capacitor/filesystem`、`Directory.Library`、relative path、`ljd/media/journal` |
| Domain | `LocalJournalEntry` / `LocalMediaRef` |
| Repository | save / getById / getByLegacyServerId / list / search / count / deleteAll |
| Mapper | Server-like shape → Local |
| Migration helper | 認証API fetch、dedupe、media download、checksum、rollback（**製品UIではない**） |
| Diagnostics | `/preview/local-storage-diagnostics`（**development only**）＋ capacitor-www offline diagnostics |

## 削除した PoC

- `src/lib/local-first/poc/*`（`local_journal_poc` / 4B-2A Storage Lab seed）
- `poc-seed-acorn.png`、雨あがりの森 fixture（製品コード外へ）→ test `__fixtures__`
- `/preview/local-first-lab`、autorun query helpers
- `cap:sync:ios:lab` → `cap:sync:ios:diagnostics` に改名

## Security 未完（必須 follow-up Phase）

- DB at-rest encryption（SQLCipher productization / export compliance / Keychain）
- Media at-rest protection（現状: 平文アプリ領域 + iOS sandbox）
- community SQLite plugin maintenance / SPM / Privacy Manifest（Filesystem C617.1 は導入済）

## Web への影響

なし。Neon / Blob 保存パスは不変。Local foundation は native 明示呼び出し時のみ。

## iOS shell

remote shell（login / loghouse / logout）は Local foundation 存在だけで変えない。

## 次 Phase 候補

1. main へ foundation 統合（ユーザー挙動不変のまま）
2. Encryption / Keychain セキュリティ Phase
3. その後に複数件 / bulk migration（progress / resume）を別Phaseで

## Dependency 再確認（導入時メモ）

| Package | Version (lock) | Notes |
| --- | --- | --- |
| `@capacitor-community/sqlite` | ^8.1.1 | Cap 8 系・**community**・SQLCipher link・SoTに community 明記 |
| `@capacitor/filesystem` | ^8.1.2 | official・Privacy Manifest C617.1 |
