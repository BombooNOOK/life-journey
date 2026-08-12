/**
 * Life Journey Diary｜Journal Save Operation Idempotency Spec
 *
 * Status: Pre-Implementation / Server Save Idempotency Candidate
 * Updated: 2026-08-13
 * Branch: feat/server-journal-save-idempotency-poc
 * Base: docs/server-success-outbox-gap-closure @ c69f7fe
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: Server Strategy C core (domain + memory + local disposable unique).
 * Forbidden now: production Neon migrate, production POST wiring, Strategy B Local intent,
 * reconciliation impl, Vercel deploy, main merge, general rollout.
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4N_SERVER_SAVE_IDEMPOTENCY_POC.md
 * - docs/hybrid/HYBRID_PHASE_4B4O_LOCAL_SAVE_OPERATION_INTENT_POC.md
 * - docs/product/ljd-local-save-operation-intent-spec.md
 * - docs/product/ljd-save-operation-reconciliation-spec.md
 * - docs/hybrid/HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md
 */

# Life Journey Diary｜Journal Save Operation Idempotency Spec

**Status:** Pre-Implementation / Server Save Idempotency Candidate  
**ラベル:** **Designed candidate**＝第一候補／**Open**＝未確定／**Forbidden now**＝本Phase実装禁止

---

## 0. Purpose

Close **Window B** (POST in flight / response lost): Server may have already created an entry and charged donguri while the client has no durable result. Without a stable **saveOperationId**, retry can create a second entry and a second charge.

This SoT is **Strategy C** only (Server save-operation idempotency). It does **not** implement durable Local pre-save intent (Strategy B) or reconciliation for Window C.

---

## 1. saveOperationId

| Property | Rule |
| --- | --- |
| Generator | Client (ULID / opaque) |
| User-facing | No |
| Not | Journal stableId, Server journal cuid, Local generation id |
| Invariance | Same user + same logical save → same id |
| Unique scope (candidate A) | `(userId, saveOperationId)` where `userId` = viewer email (align with `JournalEntry.email`). Profile may be folded later |

---

## 2. Strategy N-A vs N-B

| | N-A `JournalEntry.saveOperationId` | N-B `JournalSaveOperation` table |
| --- | --- | --- |
| Processing state | Weak (row may not exist yet / deleted on insufficient) | **Yes** |
| Response-lost lookup | Needs entry to exist | **Operation row survives** |
| Charge failure delete | Operation metadata lost with entry | **History kept** (`failed_final`) |
| Concurrent claim | App check only unless unique on entry | **Unique on operation + CAS** |
| Canonical entryId later | Entry is the record | **Nullable journalEntryId** |

**Adopted candidate A: N-B** (independent `JournalSaveOperation`).

---

## 3. Minimal schema (no content/photo/secrets)

- `id`, `userId`, `saveOperationId`, `status`, `checkpoint`, `journalEntryId?`, `requestFingerprint`, `resultCode?`, `createdAt`, `updatedAt`, `completedAt?`
- **Unique:** `(userId, saveOperationId)`
- Artifact: `prisma/poc/journal_save_operation_4b4n.sql` (not under `prisma/migrations/`)

---

## 4. Status / checkpoint

**Status:** `processing` | `completed` | `failed_final`

**Checkpoint (resume):** `claimed` → `entry_created` → `photo_completed` → `donguri_settled` → `completed`

Status growth is not a goal; checkpoints exist so retry can skip finished side effects.

---

## 5. Step idempotency (code audit)

| Step | Production today | With N-B reuse |
| --- | --- | --- |
| Journal create | Always new cuid; no operationId | Reuse `journalEntryId` on operation; CAS prevents dual attach |
| Photo | `resolveJournalEntryPhotoDbFields` + update **same** entry | Retry same entryId overwrites fields — safe for **same fingerprint**; conflict otherwise |
| Donguri | `entry:{journalEntryId}` / `alreadyCharged` | Safe **iff same entryId** reused |

---

## 6. Required semantics

1. **First:** claim → entry → photo → donguri → completed → return canonical entryId  
2. **Completed retry / response lost:** no new entry, no re-charge, same entryId  
3. **Concurrent same op:** DB unique + CAS; ≤1 live entry; ≤1 charge  
4. **Fingerprint mismatch:** `idempotency_conflict` (hashes only; no body storage)  
5. **Insufficient:** entry deleted (current UX), operation → `failed_final`; replay stable  

---

## 7. Lookup contract

`getJournalSaveOperationResult({ userId, saveOperationId })` →  
`not_found` | `processing` | `completed`(+entryId) | `failed_final`

Must be user-scoped (no cross-user read). Production HTTP route **not** required in this PoC.

---

## 8. Processing duplicate policy

No unbounded lock wait. Resume uses checkpoint CAS; loser may observe `processing` or converge on winner’s entry. Do not start a second independent create pipeline without CAS.

---

## 9. Crash fixtures N1–N5

| Id | Crash point | Retry expectation |
| --- | --- | --- |
| N1 | After claim, before entry | Create once → complete |
| N2 | After entry, before photo | No second create |
| N3 | After photo, before donguri | Charge once |
| N4 | After donguri, before completed mark | Dedup `alreadyCharged` → mark completed |
| N5 | After completed, before client 200 | Return same entryId |

N4 is a hard gate for candidate A.

---

## 10. Strategy B connection (next)

Local: generate `saveOperationId` → durable Local operation journal → POST with same id.  
Server C enables safe result recovery after response loss.

---

## 11. Security / privacy

- Operation table: metadata only  
- Logs: status / latency / result type; no body/photo/secret; consider hash/redact of operationId in production logs  
- Fingerprint: content hash + date + photo identity — never raw text

---

## 12. Rollout gates

| Gate | Now |
| --- | --- |
| Domain unit PoC | Done (4B-4N) |
| Production POST wiring | Forbidden |
| Production Neon migrate | Forbidden |
| Strategy B Local intent | Next Phase |
| General production rollout | No |
| main merge | No |
