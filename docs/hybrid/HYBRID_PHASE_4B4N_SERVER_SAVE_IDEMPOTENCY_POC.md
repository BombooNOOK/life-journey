# Hybrid Phase 4B-4N｜Server Save Operation Idempotency Core PoC

**Status:** Domain + unit PASS; local disposable unique verified; production unchanged  
**Branch:** `feat/server-journal-save-idempotency-poc`  
**Base:** `docs/server-success-outbox-gap-closure` @ `c69f7fe82a8b2be1263509daa8ee94f8793ac6a5`  
**Date:** 2026-08-13  

**Companions:**
- [ljd-journal-save-idempotency-spec.md](../product/ljd-journal-save-idempotency-spec.md)
- [ljd-save-operation-reconciliation-spec.md](../product/ljd-save-operation-reconciliation-spec.md) (4B-4M)
- [HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md](./HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**RG-1〜4:** unchanged / incomplete  

---

## 1. Goal

PoC **Strategy C** core only: Server save-operation idempotency so Window B (response lost / duplicate POST) does not dual-create or dual-charge.

**Out of scope:** Strategy B Local durable intent, reconciliation, production `POST /api/journal` wiring, Vercel, Neon migrate, main merge.

---

## 2. DB environment audit

| Check | Result |
| --- | --- |
| ORM / schema | Prisma + `prisma/migrations/` |
| `.env.local` `DATABASE_URL` | `127.0.0.1:5433/ljd_dev` (**not** Neon) |
| Disposable local | Docker `ljd-postgres-dev` healthy |
| Vercel risk | `build:vercel` runs `prisma migrate deploy` → **must not** put PoC under `prisma/migrations/` |
| Production migrate | **Forbidden** — not done |
| PoC artifact | `prisma/poc/journal_save_operation_4b4n.sql` (+ model draft txt) |
| Local unique verify | Applied SQL on disposable DB only; unique `(userId, saveOperationId)` PASS |
| Neon PoC table | **Not** created |

---

## 3. N-A vs N-B

Code audit (`POST /api/journal`: create → photo update → `chargeDiarySaveAcorns` → insufficient deletes entry):

- Insufficient path **deletes** the JournalEntry → column-on-entry (N-A) loses operation history.
- No operation id / unique today → concurrent duplicate POST can dual-create; donguri dedup is `entry:{journalEntryId}` only.

**Candidate A: N-B `JournalSaveOperation`.**

---

## 4. Design summary

- **Unique:** `(userId, saveOperationId)` (userId = viewer email in PoC)
- **Status:** `processing` \| `completed` \| `failed_final`
- **Checkpoints:** `claimed` → `entry_created` → `photo_completed` → `donguri_settled` → `completed`
- **Fingerprint:** `v1\|contentHash\|entryDate\|photoIdentity` (no body on row)
- **Lookup:** `getJournalSaveOperationResult` (domain; no production route)
- **Resume:** checkpoint CAS; orphan entry delete on lost create race
- **Donguri:** same entryId → `alreadyCharged` (N4 gate)
- **Photo:** same-entry overwrite only; not assumed cross-fingerprint safe

---

## 5. Implementation map

| Path | Role |
| --- | --- |
| `src/lib/journal/saveIdempotency/*` | Domain + memory store + fakes + tests |
| `prisma/poc/journal_save_operation_4b4n.sql` | Disposable schema artifact |
| Production `route.ts` / `schema.prisma` | **Unchanged** |

---

## 6. Tests (vitest)

File: `executeJournalSaveOperation.test.ts` — **13 PASS**

Covers: first / completed retry / response-lost (N5) / concurrent claim / processing mid-flight / N1–N4 / insufficient+replay / fingerprint conflict / cross-user / no content-secret metadata.

Local DB: unique + cross-user same op id allowed — **PASS** (disposable only).

---

## 7. N1–N5 verdict

| Case | Verdict |
| --- | --- |
| N1–N3 | Converge without duplicate entry/charge (unit) |
| N4 | **PASS** — ledger already charged → `alreadyCharged` → mark completed |
| N5 | **PASS** — completed short-circuit |

Not claiming “all auto-resume in production HTTP” — domain harness only.

---

## 8. Verdicts (completion gates)

| Question | Answer |
| --- | --- |
| Independent `JournalSaveOperation` as candidate A? | **A (yes)** |
| Server save idempotency core as A? | **A (yes, domain)** |
| Proceed to durable Local pre-save intent PoC? | **A** (after/with Local intent design) |
| Real DB verification needed before production wiring? | **A** — local unique done; production Prisma migrate still required later on disposable→staging path, **never** ad-hoc Neon PoC |
| General production rollout? | **No** |
| main merge? | **No** |

---

## 9. Next Phase recommendation

1. Durable pre-save **Local intent** (Strategy B) generating/storing `saveOperationId` before POST  
2. Then wire production `POST /api/journal` behind flag using this domain  
3. Controlled migrate of `JournalSaveOperation` via normal Prisma path on non-prod first  
4. Keep Window C reconciliation separate (4B-4M)

---

## 10. Production unchanged confirmation

- No change to `src/app/api/journal/route.ts`
- No change to `prisma/schema.prisma` / `prisma/migrations/`
- No Vercel deploy
- No Local generation / outbox / activation / RG changes
