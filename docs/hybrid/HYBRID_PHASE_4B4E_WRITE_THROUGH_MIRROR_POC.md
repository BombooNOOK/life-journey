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

## 5. Simulator W1–W10 — PASS

| 項目 | 値 |
| --- | --- |
| Test entry | `cmsppllhx0000kv04nmct79ak`（`#WriteThroughTest` + photo） |
| Server `updatedAt` | `2026-08-12T06:29:29.398Z`（失敗注入後も不変） |
| Local `stableId` | `01KZTB4JH2DFH2WGNBW9CPS5AE` |
| `legacyServerId` | `cmsppllhx0000kv04nmct79ak` |
| contentHash | `62d1473acbea63496ef093ae983be0b590027e53320d90ebf654adfeb64847ed` |
| photoHash | `4f151a52fa19d82d389ad7496deff7d4f221ac26debfaade23d15596a2b2e551` |
| candidate after | entries=4 / media=3（既存3件+本PoC1件） |
| actual DB | `prodEncrypted=false` / bytes unchanged path |
| Mac free after DD cleanup | ~9.1GB |

| Step | Result |
| --- | --- |
| W1 candidate ready | PASS |
| W2 explicit GET | PASS |
| W5 Local failure inject | PASS (`needsRetry=true`, no partial row) |
| W6 Server untouched | PASS |
| W7 retry → mirrored | PASS |
| W3 mirror success | PASS |
| W4 DB/media/hash | PASS |
| W8 already_present | PASS（stableId 不変・増殖なし） |
| W9 kill/relaunch persist | PASS（harness relaunch + rows retained） |
| W10 actual / UI untouched | PASS |

Runner: `runWriteThroughMirrorPoc`（diagnostics boot + 明示ボタン）。

---

## 6. RG

RG-1〜4 **未完のまま**。write-through 成功でも変更しない。

---

## 7. 禁止事項（遵守）

production save への組込み、independent dual-write、pointer、Repository 切替、Local原本化、Server delete/update、background sync、main merge。

---

## 8. 判定

| 問い | 判定 |
| --- | --- |
| write-through mirror を正式採用候補にできるか | **A** |
| 次に developer-only activation pointer PoC へ進めるか | **A** |
| その前に 5〜10 件追加 copy が必要か | **B**（必須ではない） |
| main 統合 | **B**（しない） |
| 次Phase | developer-only activation pointer PoC（一般 UI はまだ Local-only read にしない） |
