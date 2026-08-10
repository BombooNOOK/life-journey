/**
 * Life Journey Diary｜Hybrid Phase 4B-2B Local Journal Repository PoC
 *
 * Status: Working Notes (not Product SoT)
 * Base: feat/local-first-ios-storage-poc @ 68bbbef
 * Branch: feat/local-first-journal-repository-poc
 */

# Hybrid Phase 4B-2B｜Local Journal Repository PoC

## 目的

現行 LJD「あしあと」構造を、Local-first で長期保存できる形へ落とし込めるか検証する。  
本物のユーザー／Neon／Blob データは移行しない。

## Current Journal audit（要約）

### Prisma `JournalEntry`（FACT）

| フィールド | 分類 |
| --- | --- |
| `id` (cuid) | **D** legacy / Web互換（Local では `legacyServerId`） |
| `createdAt` / `updatedAt` | **A** device-primary |
| `email` / `profileId` | **C** server-primary（認証・住民紐付け）。Local行には保存しない（PoC） |
| `content` | **A** |
| `mood` / `activity` / `companionType` / `designTheme` / `contentFontMode` | **A候補**（表示・執筆メタ）。本 PoC の最小モデルには未採用（後続で列追加可） |
| `photoBlob*` / `photoDataUrl` | 写真実体は **A=Filesystem**。Blob URL は **C/D** |
| `generatedComment` | **B/C** 派生物・鑑定依存。Local原本必須ではない |
| `includeInBook` | **A候補**（本棚選択）。本PoC未採用 |

### 周辺

| 領域 | 分類 |
| --- | --- |
| `JournalDraft` | **A候補**（下書き）。本PoC対象外 |
| tags（本文から抽出） | **A**（Localでは明示 tags） |
| `diaryNumbers`（APIで `buildDiaryNumbers`） | **B** 再計算可能（生年月・ライフパスは server-primary 参照） |
| DiaryBook / 製本 | 定義はメタ。本文参照は Local stableId へ将来マッピング |
| 森ログ | 別 media 領域。本PoCの journal media と分離 |
| どんぐり settle | **C**（触らない） |

### Title / dateKey

現行 Neon 行に **title / dateKey 列は無い**。日付は実質 `createdAt`、タイトルは UI 側。  
Local では `dateKey` + `title` を明示する（長期検索・表示のため）。

## LocalJournalEntry モデル

```
stableId, dateKey, title, content, createdAt, updatedAt,
tags[], mediaRefs[], schemaVersion,
source, localStatus, importedAt, legacyServerId
```

## stableId（決定案）

**Local stableId を新設（Crockford ULID 互換 26桁）。**  
既存 cuid は `legacyServerId` に残す。

理由: 端末・お引越し便・guided merge の identity を server cuid に永久固定すると、将来 server 非依存化・再インポート重複で脆い。legacy は照合用。

## SQLite tables

DB: `ljd_local_journal_repo`（`Library/CapacitorDatabase`）  
`local_journal_poc`（4B-2A）は昇格させない。

- `local_journal_entries_v1`
- `local_journal_tags_v1`（検索用。tags_json も entries に冗余）
- `local_media_v1`

### tags 設計比較

| 方式 | 評価 |
| --- | --- |
| JSON text のみ | 実装簡単。数千件タグ検索は弱い |
| **別 table + INDEX（採用）** | タグ振り返り・件数増に耐える |
| JSON + 別table | 冗長だが表示と検索を両立（本PoC） |

### media

- DB: relativePath only（絶対path禁止）
- FS: `Directory.Library` + `ljd/media/journal/...`

## schema versioning

**採用: `PRAGMA user_version`**

- 単一整数・SQLite標準・migration順序が明確
- `schema_meta` は app鍵や任意メタ向けに残してよいが、schema番号の正は user_version

## Repository

`JournalRepository.save / getById / list / deletePocData / count`  
`searchLocalJournals({ dateKey, text, tag })`

## mapper

`mapServerJournalEntryLikeToLocal(serverFixture)`  
Neon API は呼ばない。fixture 1件「雨あがりの森」。

## diaryNumbers

**提案（仕様変更なし）:** Local 原本には保存しない。表示時に生年月・ライフパス等（server-primary）から再計算。キャッシュ列は将来任意。

## security follow-up

| 対象 | 課題 |
| --- | --- |
| SQLite file | SQLCipher 本暗号化・キー保管（Keychain）は次Phase |
| media files | Library at-rest は OS 端末暗号化依存。追加アプリ暗号化は未決 |
| export compliance | community SQLite = SQLCipher リンク（4B-2A docs 継続） |

## 4B-2A PoC cleanup 案（まだ削除しない）

| 資産 | 方針 |
| --- | --- |
| `local_journal_poc` table / DB | **置換予定**（journal repo DBへ。当面共存可） |
| Storage Lab dummy acorn asset | **残す**（4B-2B fixture 写真としても利用） |
| 4B-2A adapter files | **残す→後で archive** |
| Lab UI | **4B-2B操作に置換済**（4B-2Aボタン無し） |

## 起動

```bash
npm run cap:sync:ios:lab
# 正しい App.app = ios/DerivedData/.../App.app
npm run cap:run:ios:lab
```

## persistence / offline

| Test | 結果（2026-08-11 Simulator） |
| --- | --- |
| A fixture→mapper | OK（vitest） |
| B LocalJournal保存 | OK |
| C media + relative path | OK（`ljd/media/journal/...`、絶対pathなし） |
| D journal+media read | OK |
| E kill/relaunch | OK |
| F Next停止 cold start | OK（`remoteShell=false`） |
| G tag/date/text検索 | OK（各1件） |

## next phase

Server→Device「既存あしあと1件」read-only migration PoC（実Neonはユーザー明示時のみ）。
