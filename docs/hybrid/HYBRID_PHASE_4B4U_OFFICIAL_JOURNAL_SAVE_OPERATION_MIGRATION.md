# Hybrid Phase 4B-4U｜Official JournalSaveOperation Prisma Migration Promotion

**Status:** Local disposable promotion PASS（Production apply **not** done）  
**Branch:** `feat/official-journal-save-operation-migration`  
**Base:** `fix/vercel-preview-migration-gate` @ `080519370cc9e9a5cb3121c6639a86ebf21778f0`  
**Date:** 2026-08-13  

**Companions:**
- [ljd-journal-save-idempotency-spec.md](../product/ljd-journal-save-idempotency-spec.md)
- [ljd-database-migration-deployment-safety-spec.md](../product/ljd-database-migration-deployment-safety-spec.md)
- [HYBRID_PHASE_4B4P_NONPROD_PRISMA_IDEMPOTENCY_INTEGRATION.md](./HYBRID_PHASE_4B4P_NONPROD_PRISMA_IDEMPOTENCY_INTEGRATION.md)
- [HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md](./HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md)
- [HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md](./HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md)
- [HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md](./HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md)
- [HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md](./HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**Production Neon / Vercel Production deploy / POST wiring:** **No**

---

## 1. Goal

Promote 4B-4P `JournalSaveOperation` candidate → official `schema.prisma` + `prisma/migrations/`, re-verify with formal `prisma migrate deploy` on **local disposable** Postgres only.

---

## 2. DB hard gate

| Allowed | Forbidden |
| --- | --- |
| `127.0.0.1:5433/ljd_dev` (`ljd-postgres-dev`) | Neon / remote hosts |
| Fresh helper DB `ljd_4b4u_fresh` on same local instance（destroyed after） | Production `DATABASE_URL` |

Helper: `assertLocalDisposableDatabaseUrl`.

---

## 3. Model / enum decision

| Field | Choice | Why |
| --- | --- | --- |
| `status` / `checkpoint` | **String** + domain validation | Project `schema.prisma` has **zero** Prisma enums; other status fields are String |
| Domain status | `processing` \| `completed` \| `failed_final` | Unchanged |
| Domain checkpoint | `claimed` \| `entry_created` \| `photo_completed` \| `donguri_settled` \| `completed` | Unchanged |
| `actorKey` | String | Not schema-locked as email; today = normalized viewer email |
| `journalEntryId` | nullable String, **no FK** | Preserve operation history if JournalEntry removed |

Semantic drift vs 4B-4P PoC SQL: **none**（additive CREATE + same unique/index; dropped PoC-only `IF NOT EXISTS` / rename residue helpers）.

---

## 4. Migration

| Item | Value |
| --- | --- |
| Directory | `prisma/migrations/20260813140000_add_journal_save_operation/` |
| SQL | CREATE TABLE + PK + unique `(actorKey, saveOperationId)` + index `(actorKey, createdAt)` |
| Destructive statements | **None**（no DROP of product tables） |
| FK | **None** |

### SQL review checklist

- [x] CREATE TABLE `JournalSaveOperation`  
- [x] UNIQUE `(actorKey, saveOperationId)`  
- [x] INDEX `(actorKey, createdAt)`  
- [x] No FK / no CASCADE  
- [x] No DROP / ALTER of existing LJD tables  

---

## 5. Local verification

| Check | Result |
| --- | --- |
| Populated upgrade (`ljd_dev`) | PASS — JE 58→58, donguri 12→12; PoC untracked table dropped then official migrate |
| Second `migrate deploy` | **No pending migrations** |
| Fresh blank DB full history | PASS — all 42 migrations incl. this one; DB dropped after |
| Prisma client `journalSaveOperation` | PASS |
| Integration unique/concurrent/N1–N5 | PASS（`RUN_LOCAL_DB_INTEGRATION=1`） |

---

## 6. Preview gate (U-P)

| Case | Result |
| --- | --- |
| U-P1 Preview plan with new migration present → no migrate step | PASS |
| U-P2 `prisma generate` + `next build` | PASS |
| U-P3 Production plan selects migrate（fake harness） | PASS |
| tsc | PASS |
| Hybrid + gate regression | **146 passed** |
| Prisma integration（local） | PASS |

Vercel Preview Ready status after push: **not claimed as observed**（no log speculation）.

---

## 7. Production release checklist（NOT executed）

Before any Production apply:

1. SQL review signed off（this doc §4）  
2. Local fresh + upgrade PASS  
3. Preview migration gate PASS（4B-4T.1）  
4. Production schema compatibility review（additive only）  
5. Backup/restore capability confirmed  
6. Migration apply runbook + monitoring  
7. App deploy with **idempotency feature OFF**  
8. Internal Server operation verify  
9. Only then consider production save wiring  

**Order:** migrate → verify → deploy (feature off) → internal → wiring.  
Do **not** change save behavior at migration instant.

---

## 8. Still incomplete（docs）

| Item | Status |
| --- | --- |
| Strategy C controlled migration outside build | **未完**（長期本命） |
| Strategy D Preview-only DB | Not configured（shared DATABASE_URL） |
| Pagination caps 200/400/500 | Separate blocker（4B-4S） |
| Production POST `/api/journal` | Unchanged — table may exist unused |

---

## 9. Verdicts

| Question | Answer |
| --- | --- |
| Official JournalSaveOperation migration as candidate A? | **A**（local verified） |
| Apply migration to Production DB now? | **B** |
| Need firmer controlled migration procedure first? | **A**（recommended before Production apply; Strategy C still open） |
| Next: internal Production-server wiring design? | **A**（design next; not POST enable） |
| Production POST wiring now? | **B** |
| main merge? | **No** |
