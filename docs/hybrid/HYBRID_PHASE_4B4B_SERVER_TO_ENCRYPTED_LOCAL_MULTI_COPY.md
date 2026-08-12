# Hybrid Phase 4B-4B｜Server → Encrypted Local Candidate Multi-entry Copy

**Base branch:** `feat/fresh-encrypted-local-journal-bootstrap` @ `c24e1258337f1c6a4d0294d03a666b834f2d03ee`  
**This branch:** `feat/server-to-encrypted-local-multi-copy`  
**main:** `a160d25743d82713b3d218abacd2d26833b0bc9b`（未 merge）

---

## 1. 目的

明示指定した **テスト用** Server あしあと複数件を、encrypted candidate `ljd_local_journal_secure_candidate` へ copy できることを実証する。

active DB 切替・Local 原本化・Server 更新は行わない。

---

## 2. explicit entry IDs

対象は入力された ID のみ。

禁止: 全件検索 / 最新順自動選択 / ランダム選択 / 実ユーザー通常あしあとの代用。

PoC コピー許可タグ（いずれか必須）:

- `#テスト`
- `#お引越しテスト`
- `#LocalCopyTest`

タグが無い明示 ID は `not_test_entry` で fail。自動では拾わない。

失敗注入 ID（実 Server を壊さない）: `ljd-poc-missing-entry-id`

---

## 3. Server GET-only

再利用: 4B-2C と同じ認証済み経路。

- `GET /api/journal/[id]`
- `GET /api/journal/entries/[entryId]/photo`
- cookie / session
- Neon 直 SQL 禁止
- native へ DB credentials 禁止
- Server write API 禁止

部品は `serverFetch.ts` に移植。4B-2C branch の wholesale merge はしない。

---

## 4. candidate-only

allowlist: `ljd_local_journal_secure_candidate` のみ。

`ljd_local_journal` および fixture DB への write は `assertAllowedCopyTargetDb` で拒否。

通常 `JournalRepository` の接続先は変更しない。

`ServerToLocalCandidateCopyService` が candidate connection / repository / media store を明示受領。

---

## 5. mapping

Server → 正式 `LocalJournalEntry`

- 新 ULID `stableId`（Server cuid を永久 ID にしない）
- `legacyServerId` = server cuid
- `source=migrated_server`
- `serverUpdatedAt` / `importedAt` / `dateKey` / `content` / `tags` / `mediaRefs`

---

## 6. dedupe / source_changed

第一キー: `legacyServerId`

| 状況 | 結果 |
| --- | --- |
| 同一 fingerprint | `already_present`（新 ULID なし・row/media 増殖なし） |
| `serverUpdatedAt` / content hash / tags / photo hash が変化 | `source_changed`（**自動上書きしない**） |

fingerprint は hash のみ。本文全文は log / report しない。

同期機能はこの Phase では作らない。

---

## 7. media

namespace: `ljd/media/journal-secure-candidate/`  
（active `ljd/media/journal/` と分離。activation 時の最終 path は未決）

- relative path のみ DB 保存
- SHA-256
- write 後 re-read 検証
- failure 時 partial file rollback
- actual journal media は触らない

---

## 8. per-entry atomicity / batch

巨大 batch transaction は使わない。1 entry 論理ユニット:

fetch → media fetch → checksum → Filesystem write → verify → DB transaction → completed

途中失敗: DB row なし / tag なし / media partial なし。

batch 結果: `copied` / `already_present` / `source_changed` / `failed`  
1件失敗でも他 entry は続行。Server 原本は GET-only のため安全。

---

## 9. kill / resume

専用 migration state DB は作らない。

同じ explicit ID list を再実行:

- 完了済み → `already_present`
- 未完了 → copy
- partial → rollback 済みなので再 copy

---

## 10. capacity

正式 `StorageCapacityProvider`。batch 開始前に known 必須。unknown → fail-closed。  
product reserve は未確定。写真が available を超える場合はその entry を fail し partial を残さない。

---

## 11. Server untouched / active 未切替 / RG

copy は GET のみ。Server update/delete/tag/photo 変更なし。

active pointer / repository default 切替 / candidate rename / actual DB 変更なし。

RG-1〜4 は未完のまま。

---

## 12. Simulator

| Step | 状態 |
| --- | --- |
| C1 candidate ready / 0 rows | **PASS**（encrypted / schema v1 / rows 0/0/0 / Complete / backup included / actual plaintext 無変更） |
| C2〜C10 実 Server multi-copy | **停止。** 安全に使えるテスト用あしあと ID が 3 件揃っていない |

一般あしあとは使わない。unit test は fixture で multi-copy / dedupe / source_changed / rollback を PASS。
