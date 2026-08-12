# Hybrid Phase 4B-4E｜Server-authoritative Write-through Mirror PoC

**Base:** `docs/local-journal-write-routing-architecture` @ `40eaa7b09c917e4e7f0653a58f0352041cd285a2`  
**Branch:** `feat/server-authoritative-write-through-mirror-poc`  
**SoT:** `docs/product/ljd-local-journal-write-routing-spec.md`  
**Scope:** developer-only mirror of one explicit Server entry into encrypted candidate.  
**Not in scope:** production Journal save wiring, dual-write, activation pointer, Repository read switch, Local原本化, background sync, main merge.

---

## 1. Mirror primitive（共通化）

| 層 | 役割 |
| --- | --- |
| `mirrorServerJournalEntryToLocalGeneration` | 低レベル共通：Server GET → Local ULID + `legacyServerId` → candidate DB/media |
| `ServerToLocalCandidateCopyService` | historical multi-copy（`mirrored` → `copied`） |
| `ServerAuthoritativeWriteThroughMirrorService` | write-through PoC（`MirrorResult` + `needsRetry`） |

同一 primitive。ロジック二重実装なし。

Statuses: `mirrored` | `already_present` | `source_changed` | `failed`  
`source_changed` は自動 overwrite しない。

---

## 2. MirrorResult（pending 表現・queue なし）

```ts
{
  result,          // mirrored | already_present | source_changed | failed | blocked
  serverEntryId,
  needsRetry,      // Server GET OK かつ Local 失敗時 true
  stableId,
  legacyServerId,
  injectedLocalFailure, // save | media_write | false
  ...
}
```

permanent queue / background sync / automatic retry **禁止**（今回未実装）。

---

## 3. Target

- DB: `ljd_local_journal_secure_candidate` のみ（非 active）
- media: `ljd/media/journal-secure-candidate/`
- actual `ljd_local_journal`: **write 禁止**
- 一般「森にあしあとを残す」: **未接続**（Server only）

---

## 4. Unit tests

`ServerAuthoritativeWriteThroughMirrorService.test.ts` + 既存 copy tests:

canonical mirror / candidate guard / stableId / legacyServerId / media SHA /  
Server-OK Local-fail inject / retry / already_present / partial rollback /  
source_changed / no overwrite / capacity unknown fail-closed / no-secret logging / actual DB protection  

**26 tests PASS**（vitest, 2026-08-12）。

---

## 5. Simulator W1–W10

**Status: BLOCKED — explicit new test entry ID not provided.**

要件どおり Cursor は一般あしあとを選ばない。  
ユーザーが Web LJD で `#WriteThroughTest` または `#テスト`（可能なら写真1）を保存し、cuid を明示するまで W1–W10 は実行しない。

Runner: `runWriteThroughMirrorPoc({ entryId })`（diagnostics ボタン）。

---

## 6. RG

RG-1〜4 **未完のまま**。write-through 成功でも変更しない。

---

## 7. 禁止事項（遵守）

production save への組込み、independent dual-write、pointer、Repository 切替、Local原本化、Server delete/update、background sync、main merge。
