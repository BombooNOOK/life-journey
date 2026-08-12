# Hybrid Phase 4B-4G｜Developer-only Generation Resolver Integration PoC

**Base:** `feat/local-journal-activation-pointer-poc` @ `390eebab44b41fd28f45f719f4c22b46ca61e159`  
**Branch:** `feat/local-generation-resolver-integration-poc`  
**Formal main (unmerged):** `a160d25743d82713b3d218abacd2d26833b0bc9b`

---

## 1. 位置づけ（3段階の分離）

| 段階 | 今回 |
| --- | --- |
| Technical activation | 利用（4B-4F manifest） |
| **Developer-only transitional routing** | **実証**（resolve → mirror target） |
| Production pointer-driven routing | **しない** |
| Local Source-of-Truth switch | **しない** |

一般 UI / JournalRepository / production save **無変更**。

---

## 2. 責務分離

| 層 | 役割 |
| --- | --- |
| `resolveLocalJournalGenerationTarget` | manifest → `ResolvedLocalJournalGeneration` or deny |
| `mirrorServerJournalEntryToLocalGeneration` | 指定 ports へ mirror（manifest を読まない） |
| `DeveloperResolvedGenerationMirror` | resolve → **固定 target** → mirror → optional checksum drift warning |

Historical copy（4B-4B）も同じ `ResolvedLocalJournalGeneration` / pair integrity を利用可能。低レベル primitive は二重化しない。

---

## 3. `ResolvedLocalJournalGeneration`

`generation`, `databaseId`, `mediaRootId`, `schemaVersion`, `manifestChecksum`  
（secret / passphrase なし）

DB/media は allowlist pair のみ。plaintext `ljd_local_journal` 拒否。

---

## 4. Unit tests

`generationResolverIntegration.test.ts` + 既存 4B-4E/F — **54 PASS**（本スイート 11 + 回帰）。

---

## 5. Simulator R1–R10 — PASS

再利用 entry: `cmsppllhx0000kv04nmct79ak`（4B-4E `#WriteThroughTest`）。

| Step | Result |
| --- | --- |
| R1 resolve | PASS（generation=2 / candidate + media pair） |
| R2 mirror via resolved | PASS（`already_present`） |
| R3 already_present | PASS（stableId 不変） |
| R4 corrupt → no mirror | PASS |
| R5 missing DB → no mirror | PASS |
| R6 plaintext reject | PASS |
| R7 wrong media pair reject | PASS |
| R8 capacity unknown reject | PASS |
| R9 fixed target | PASS |
| R10 actual DB untouched | PASS |

---

## 6. RG

RG-1〜4 **未完**。変更なし。

---

## 7. 判定

| 問い | 判定 |
| --- | --- |
| generation resolver integration を正式採用候補にできるか | **A** |
| 次に production 配線設計へ進めるか | **B**（まだ早い。一般 UI は Server） |
| その前に generation 命名を正式化すべきか | **B**（必須ではない。candidate id のまま可） |
| 5〜10 件追加 copy が必要か | **B** |
| main 統合 | **B** |
| 次Phase推奨 | production routing 設計比較（配線はしない）または明示 5〜10 件追加 copy。**main merge しない** |