# Hybrid Phase 4B-4P｜Non-production Prisma Idempotency Integration

**Status:** Local disposable Postgres PASS; `prisma/migrations/` **not** promoted  
**Branch:** `feat/nonprod-prisma-journal-save-idempotency`  
**Base:** `fix/hybrid-preview-build-health` @ `954e14fcce602b92842f019183ddf43f335bdf4c`  
**Date:** 2026-08-13  

**Companions:**
- [ljd-journal-save-idempotency-spec.md](../product/ljd-journal-save-idempotency-spec.md)
- [HYBRID_PHASE_4B4N_SERVER_SAVE_IDEMPOTENCY_POC.md](./HYBRID_PHASE_4B4N_SERVER_SAVE_IDEMPOTENCY_POC.md)
- [HYBRID_PHASE_4B4O_LOCAL_SAVE_OPERATION_INTENT_POC.md](./HYBRID_PHASE_4B4O_LOCAL_SAVE_OPERATION_INTENT_POC.md)
- [HYBRID_PHASE_4B4O1_PREVIEW_BUILD_HEALTH.md](./HYBRID_PHASE_4B4O1_PREVIEW_BUILD_HEALTH.md)
- [ljd-save-operation-reconciliation-spec.md](../product/ljd-save-operation-reconciliation-spec.md)
- [HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md](./HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md)
- [ljd-database-migration-deployment-safety-spec.md](../product/ljd-database-migration-deployment-safety-spec.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`

---

## 1. Goal

Prove **JournalSaveOperation** on disposable non-production PostgreSQL via Prisma adapter.  
No production POST wiring. No Neon migration. No unsafe Preview migration push.

---

## 2. Vercel migration safety audit

| Item | Finding |
| --- | --- |
| Build command | `vercel.json` → `npm run build:vercel` |
| Script | `prisma generate && prisma migrate deploy && next build` |
| Effect | Any file under `prisma/migrations/` is applied to whatever `DATABASE_URL` the Vercel env uses |
| Vercel env vars | **Not modified** this Phase |
| Production / Preview `DATABASE_URL` host compare | **Not verified** (Vercel CLI token expired; no dashboard evidence in-repo) |
| Preview DB isolation | **Unknown / unproven** → treat as **not isolated** for safety |

**Gate decision:** do **not** add formal migration under `prisma/migrations/`.  
Candidate SQL only: `prisma/poc/4b4p_journal_save_operation.sql`.

---

## 3. Local DB identity (hard-checked)

| Field | Value |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `5433` |
| Database | `ljd_dev` |
| Docker | `ljd-postgres-dev` healthy |
| Neon | **Forbidden** — gate rejects neon-like hosts |

Helper: `assertLocalDisposableDatabaseUrl` / `auditDatabaseUrlForNonprodIdempotency`.

---

## 4. Prisma model

`JournalSaveOperation` in `prisma/schema.prisma` (client generate only).

| Column | Notes |
| --- | --- |
| `actorKey` | Normalized viewer-email today (not named `email`) |
| `saveOperationId` | Client opaque id |
| `requestFingerprint` | Hash identity only |
| `status` / `checkpoint` / `journalEntryId?` / `resultCode?` / timestamps | Metadata |
| Unique | `(actorKey, saveOperationId)` |

Domain `userId` ↔ DB `actorKey` in repository adapter.  
**JournalEntry schema unchanged** — operation table only.

---

## 5. Repository

`createPrismaJournalSaveOperationStore(prisma)` implements `JournalSaveOperationStore`.  
Domain `executeJournalSaveOperation` unchanged (no Prisma embed).

---

## 6. Real DB verification (local)

Integration file: `prismaJournalSaveOperation.integration.test.ts`  
`RUN_LOCAL_DB_INTEGRATION=1` → **10 PASS** (plus 2 gate unit tests).

Covered: unique / cross-actor / concurrent claim / persistence-reopen / N1–N5 / N4 no re-charge / insufficient+replay / fingerprint / lookup / isolation.

Donguri: fixture ports with `entry:{id}` semantics — **production ledger untouched**.

---

## 7. Production unchanged

- No `POST /api/journal` wiring  
- No Neon apply  
- No Vercel env change  
- No Local intent change  
- No `prisma/migrations/` new folder  

---

## 8. Build health gate (4B-4O.1 rule)

| Check | Result |
| --- | --- |
| `tsc --noEmit` | PASS |
| Hybrid regression (98) | PASS |
| `prisma generate && next build` (no migrate deploy) | **PASS** |

---

## 9. Migration promotion gate

| Question | Verdict |
| --- | --- |
| Nonprod semantics / unique / concurrent | **A** |
| Promote candidate → `prisma/migrations/` now? | **B** — Preview DB isolation unproven |

---

## 10. Next

**4B-4Q** internal E2E: Local intent → idempotent Server op → canonical entryId → mirror outbox candidate.  
Still not general production POST rollout.
