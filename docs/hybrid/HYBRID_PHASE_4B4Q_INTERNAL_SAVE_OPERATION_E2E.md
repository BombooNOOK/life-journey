# Hybrid Phase 4B-4Q｜Internal End-to-End Save Operation Recovery PoC

**Status:** Domain E2E PASS (Q1–Q6 + response-lost); Prisma local response-lost optional PASS  
**Branch:** `feat/internal-save-operation-e2e-poc`  
**Base:** `feat/nonprod-prisma-journal-save-idempotency` @ `205b5a390df1dc1910035d21e6ee7c8374f3ad45`  
**Date:** 2026-08-13  

**Companions:**
- [ljd-save-operation-reconciliation-spec.md](../product/ljd-save-operation-reconciliation-spec.md)
- [ljd-journal-save-idempotency-spec.md](../product/ljd-journal-save-idempotency-spec.md)
- [ljd-local-save-operation-intent-spec.md](../product/ljd-local-save-operation-intent-spec.md)
- [ljd-local-mirror-outbox-spec.md](../product/ljd-local-mirror-outbox-spec.md)
- [HYBRID_PHASE_4B4P_NONPROD_PRISMA_IDEMPOTENCY_INTEGRATION.md](./HYBRID_PHASE_4B4P_NONPROD_PRISMA_IDEMPOTENCY_INTEGRATION.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`

---

## 1. Goal

Connect **B (Local intent) + C (Server idempotency) + outbox mirror** in an **internal-only** E2E without production POST / Neon / official migrations.

---

## 2. Harness

| Piece | Path |
| --- | --- |
| Orchestrator | `src/lib/local-first/journal/save/internalSaveOperationE2e.ts` |
| Unit E2E | `internalSaveOperationE2e.test.ts` (memory) |
| Prisma leg | `internalSaveOperationE2e.prisma.integration.test.ts` (local `ljd_dev` only) |
| Dev page | `/preview/save-operation-e2e` (`NODE_ENV=development` else 404) |

**Order:** `saveOperationId` → Local intent → internal `executeJournalSaveOperation` → lookup/bind → outbox enqueue → Local mirror sink → ack → intent completed.

Production `POST /api/journal`: **unused**.

---

## 3. DB

- Hard gate: `127.0.0.1:5433/ljd_dev` only for Prisma leg  
- Candidate SQL remains `prisma/poc/4b4p_journal_save_operation.sql`  
- **No** `prisma/migrations/` promotion (Preview isolation still unknown)

---

## 4. Q1–Q6 matrix

| Id | Crash | Result |
| --- | --- | --- |
| Q1 | before intent | no Server op / no entry |
| Q2 | intent after / POST before | relaunch → `not_found` → `recovery_required` (no empty POST) |
| Q3 | response lost after Server completed | lookup → same entryId → mirror complete; create=1 charge=1 |
| Q4 | Window C: bind / before outbox | relaunch rebuilds outbox from `server_completed` |
| Q5 | Window D: outbox / before mirror | pending survives; recover mirrors + ack |
| Q6 | mirror / before ack | drain outbox; intent completed |

---

## 5. Final invariant (success)

- save operation = 1  
- JournalEntry = 1  
- donguri settlement = 1  
- canonical entryId = 1  
- intent = completed  
- outbox pending = 0  
- Local mirror = 1  
- `legacyServerId` = canonical cuid  

Photo: fixture identity / SHA field exercised in memory E2E (`photoSha256`); live Server blob photo not required for core PASS.

---

## 6. SERVER_SUCCESS_TO_OUTBOX_GAP

| Criterion | Verdict |
| --- | --- |
| response lost → no duplicate create/charge | **PASS** (Q3) |
| Server-only committed result recoverable | **PASS** (lookup) |
| mirror outbox re-injectable | **PASS** (Q4/Q5) |
| kill/relaunch convergence | **PASS** (Q1–Q6 memory) |
| silent loss | **Closed for B+C path** when intent+operation durable |
| generation fail-closed | Fixture target uses technical_active pair; live registry preflight remains 4B-4L native |

**Closure judgment:** **A for B+C internal E2E** (domain + disposable Prisma leg).  
**Not** general production closure — production POST still unwired; official migration not promoted.

### Lightweight reconciliation (A)

Still **recommended as insurance**:

- Intent DB is backup-excluded → restore can drop Local intents  
- Preview/production DB isolation unknown  
- Users without intent (older clients) still need Server-side discovery  

B+C closes the primary Window B/C path when intent exists; **A remains next insurance**.

---

## 7. Build health

| Check | Result |
| --- | --- |
| tsc | PASS |
| E2E + Hybrid regression | PASS |
| next build (no migrate deploy) | PASS |
| Production / Neon / migrations/ | Unchanged |

---

## 8. Verdicts

| Question | Answer |
| --- | --- |
| B+C internal E2E as A? | **A** |
| `SERVER_SUCCESS_TO_OUTBOX_GAP` closed? | **A (internal B+C)** / production rollout still open |
| Lightweight reconciliation next? | **A** |
| Official Prisma migration promotion? | **B** (Preview isolation unknown) |
| Production POST wiring now? | **B** |
| main merge? | **No** |
