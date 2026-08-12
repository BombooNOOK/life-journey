# Hybrid Phase 4B-4F｜Developer-only Activation Pointer PoC

**Base:** `feat/server-authoritative-write-through-mirror-poc` @ `578983adaa415854b0affc729f1012800acee9f3`  
**Branch:** `feat/local-journal-activation-pointer-poc`  
**Formal main (unmerged):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**SoT:** `docs/product/ljd-local-journal-activation-spec.md`

---

## 1. Three activations（分離）

| 種別 | 今回 | 意味 |
| --- | --- | --- |
| **Technical activation** | **PASS 実証** | manifest が encrypted candidate を technical active と指す |
| **UI activation** | **しない** | 一般 Journal Repository / Local-only read 切替 |
| **Source-of-Truth switch** | **しない** | Local原本化。RG-1〜4 未完のまま |

Server は引き続き原本。一般 UI は Server read/write。

---

## 2. Manifest

| 項目 | 値 |
| --- | --- |
| 場所 | Application Support LJD dir / `ljd-local-journal-activation.json` |
| 禁止 | localStorage / sessionStorage / Keychain |
| atomic write | native `atomicReplaceTextFile`（temp → FileHandle.synchronize → replaceItemAt） |
| checksum | SHA-256 of canonical JSON（keys sorted; `checksum` フィールド除外） |

Schema: `formatVersion`, `generation`, `activeDatabaseId`, `activeMediaRootId`, `previousDatabaseId`, `previousMediaRootId`, `activationState`, `schemaVersion`, `activatedAt`, `checksum`.

初回: `previous* = null`。将来 gN→gN+1 で previous を rollback 用に使用（DB rename なし）。

---

## 3. Target / media / write-through

- DB: `ljd_local_journal_secure_candidate`（rename なし）
- media: `ljd/media/journal-secure-candidate/`（copy/rename なし）
- write-through: **引き続き candidate 明示 target**（pointer-driven routing なし）
- actual `ljd_local_journal`: 無変更

---

## 4. Unit tests

`activationPointer.test.ts` — **17 PASS**

---

## 5. Simulator P1–P12 — PASS

| Step | Result |
| --- | --- |
| P1 manifest 不存在 | PASS |
| P2 candidate preflight | PASS（entries=4 encrypted） |
| P3 technical activation | PASS（`activated`, generation=2） |
| P4 readback / checksum | PASS（64 hex） |
| P5 developer resolve → candidate | PASS |
| P6 kill/relaunch resolve | PASS（re-resolve + manifest file persists） |
| P7 already_active | PASS |
| P8 corrupt → fail-closed | PASS |
| P9 missing DB → fail-closed | PASS |
| P10 rollback semantics | PASS（generation A 維持） |
| P11 actual plaintext 無変更 | PASS |
| P12 一般 UI Server 維持 | PASS |

---

## 6. RG

RG-1〜4 **未完**。technical activation ≠ Source-of-Truth switch。

---

## 7. 判定

| 問い | 判定 |
| --- | --- |
| pointer/generation を正式採用候補にできるか | **A** |
| technical activation PoC を main 候補へ進められるか | **B**（UI/SoT 未接続・RG 未完。feature branch 維持） |
| 次に pointer-driven routing へ進めるか | **B**（まだ早い。一般 UI は Server） |
| 5〜10 件追加 copy を先に行うべきか | **B**（必須ではない） |
| 次Phase推奨 | 明示 ID 5〜10 件を同 generation へ追加 copy（任意）→ pointer-driven routing 設計比較 / または SoT 切替条件の整理。**main merge しない** |
