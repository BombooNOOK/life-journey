# Hybrid Phase 4B-4S｜Internal Lightweight Create Reconciliation PoC

**Status:** Domain PoC PASS（S1–S14 memory + optional local Postgres fixture）  
**Branch:** `feat/internal-lightweight-create-reconciliation-poc`  
**Base:** `docs/lightweight-create-reconciliation` @ `c6255f7b9a603624064e7203e96e2ad4bc574d04`  
**Date:** 2026-08-13  

**Parent SoT:** [ljd-lightweight-create-reconciliation-spec.md](../product/ljd-lightweight-create-reconciliation-spec.md)

**Cross-links:**
- [HYBRID_PHASE_4B4R_LIGHTWEIGHT_CREATE_RECONCILIATION_ARCHITECTURE.md](./HYBRID_PHASE_4B4R_LIGHTWEIGHT_CREATE_RECONCILIATION_ARCHITECTURE.md)
- [HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md](./HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md)
- [HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md](./HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md)
- [ljd-local-mirror-outbox-spec.md](../product/ljd-local-mirror-outbox-spec.md)
- [ljd-local-generation-lifecycle-spec.md](../product/ljd-local-generation-lifecycle-spec.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`

---

## 1. Goal

Implement **Strategy A** insurance (missing **create** only) on **local disposable Server DB + memory Local**, reusing existing outbox / mirror primitives.  
Not a B+C substitute. No production API / Neon / official migration / main merge.

---

## 2. Checkpoint semantics correction (from 4B-4R)

| Topic | Final (4B-4S) |
| --- | --- |
| Past-month advance | Only after **Local `legacyServerId` completeness** re-check + **no pending outbox** for scope |
| Outbox enqueue alone | **Does not** advance watermark |
| Current month | Always bounded rescan; **never** `lastFullyReconciledMonth` |
| `recovery_captured` | Run-local intermediate only; **not** persistent completeness |
| Why | Checkpoint backup-include vs outbox backup-exclude → enqueue-then-advance is restore-unsafe |

---

## 3. Implementation map

| Piece | Path |
| --- | --- |
| Service | `src/lib/local-first/journal/reconciliation/reconcileMissingServerJournalCreates.ts` |
| Checkpoint store | `CreateReconciliationCheckpointStore.ts` (memory) |
| List caps | `journalListCaps.ts`（route 実値: list **200** / calendar month **400** / year **500**） |
| Server list port | `serverMonthListPort.ts` + `prismaServerMonthListPort.ts` |
| Tests | `reconcileMissingServerJournalCreates.test.ts`（S1–S14） |
| Optional Postgres | `createReconciliation.prisma.integration.test.ts`（`RUN_LOCAL_DB_INTEGRATION=1`） |

---

## 4. Server list cap（Release Constraint）

Production `GET /api/journal` has **no pagination**.  
`responseCount >= configuredCap` → `list_cap_reached` / scope incompleteness → **checkpoint advance forbidden**.  
**Pagination/cursor may be required before production release** (Release Blocker candidate).  
4B-4S does **not** add pagination API.

---

## 5. Recovery bridge

```
missing Server id
→ resolve healthy technical_active
→ enqueueBeforeMirror (existing)
→ attemptMirror (existing semantics / memory bridge in unit)
→ Local completeness re-check
→ past month: maybe advance checkpoint
```

New recovery jobs target **run-time healthy technical_active** (not pending retarget).

---

## 6. Cases S1–S14

| Case | Result |
| --- | --- |
| S1 existing Local | no-op |
| S2 Server-only detect | missing |
| S3 outbox→mirror→Local | PASS |
| S4 rerun idempotent | PASS |
| S5 advance after Local complete | PASS |
| S6 pending mirror → no advance | PASS |
| S7 current month rescan | PASS |
| S8 API failure → checkpoint held | PASS |
| S9 list cap → incomplete | PASS |
| S10 generation fail-closed | PASS |
| S11 old-client insurance | PASS |
| S12 restore inconsistency → rewind+rescan | PASS |
| S13 plaintext DB unused | PASS |
| S14 production route unchanged | PASS |

---

## 7. Release role

| Layer | Role |
| --- | --- |
| B+C | Usual save path Window B/C |
| A (this) | Restore / outbox loss / old client insurance |

A alone does **not** close production `SERVER_SUCCESS_TO_OUTBOX_GAP`.

---

## 7b. Build health

| Check | Result |
| --- | --- |
| tsc | PASS |
| Reconciliation + Hybrid regression | **135 passed**（+ integration optional PASS on `ljd_dev`） |
| next build（no migrate deploy） | PASS |
| `prisma/migrations/` / production POST | Unchanged |
| Mac free（after） | ~8.2Gi |

**Latest:** `f7f6fce3528f65f3f6cea81f927e536fa091a8b8`

---

## 8. Verdicts

| Question | Answer |
| --- | --- |
| Lightweight create reconciliation as implementation candidate A? | **A** |
| Past-month checkpoint only after Local mirror complete? | **A**（formal） |
| List cap / pagination as production release blocker candidate? | **A** |
| B+C+A three-layer recovery architecture as A? | **A** |
| Vercel Preview DB isolation / official migration now? | **B** |
| Production POST wiring now? | **B** |
| main merge? | **No** |

---

## 9. Forbidden confirmation

No Neon, no production API change, no pagination API, no official migration, no update/delete/background/multi-device sync, no Local read switch, no main merge.
