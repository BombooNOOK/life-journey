# Hybrid Phase 4B-4V｜Controlled Production Migration Architecture & Runbook

**Status:** Architecture + local-dry harness PASS（Production Neon **not** applied）  
**Branch:** `docs/controlled-production-migration-runbook`  
**Base:** `feat/official-journal-save-operation-migration` @ `e85b982d838cc7d9e6625d18c0e834372de26c19`  
**Date:** 2026-08-13  

**Parent SoT:** [ljd-production-database-migration-runbook.md](../product/ljd-production-database-migration-runbook.md)

**Cross-links:**
- [HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md](./HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md)
- [HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md](./HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md)
- [HYBRID_PHASE_4B4U_OFFICIAL_JOURNAL_SAVE_OPERATION_MIGRATION.md](./HYBRID_PHASE_4B4U_OFFICIAL_JOURNAL_SAVE_OPERATION_MIGRATION.md)
- [ljd-database-migration-deployment-safety-spec.md](../product/ljd-database-migration-deployment-safety-spec.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**Production Neon / deploy / POST:** **No**

---

## 1. Decision: remove migrate from Production build（B）

| Option | Verdict |
| --- | --- |
| **A** Keep migrate inside Production `build:vercel` | **B** — couples schema mutation to app deploy; weaker control |
| **B** Remove migrate from all Vercel builds; controlled command only | **A（長期第一候補・本 Phase 実装）** |

4B-4T.1 Preview gate remains necessary historically; 4B-4V completes Strategy **C**: **no** `prisma migrate deploy` in application build for Preview **or** Production.

Implementation: `scripts/vercel-build.mjs` → always `prisma generate` + `next build`.

---

## 2. Controlled command

| Piece | Path |
| --- | --- |
| Runner | `scripts/controlled-production-migrate.mjs` |
| Tests | `scripts/controlled-production-migrate.test.ts` |
| npm | `db:migrate:controlled:plan` / `:local-dry` / `:production:plan` |

Gates: mode, allow=`YES`, backup=`YES`, fingerprint, pending allowlist.  
No full URL/password logs.  
Not hooked from build / postinstall / dev.

Prisma realities: `migrate status` + `migrate deploy` only — **no** invented dry-run deploy.

---

## 3. Pending migrations rule

`migrate deploy` applies **all** pending.  
Operator must set `LJD_EXPECTED_PENDING_MIGRATIONS` to the **exact** pending set after `migrate status`.  
Candidate name: `20260813140000_add_journal_save_operation` — do not assume it is alone.

---

## 4. Backup Gate

`LJD_PRODUCTION_BACKUP_CONFIRMED=YES` required for production mode.  
4B-4V does not run backup; user must confirm capability before **4B-4V.1**.

---

## 5. Failure matrix V1–V6

See runbook §8. Local-dry tests cover V1/V2/V4-shaped blocks without Neon.

---

## 6. Feature OFF

Table may exist after migrate; production save still unwired → existing LJD behavior unchanged.  
Forward-fix over down migration.

---

## 7. Next

**4B-4V.1｜Controlled Production Schema Migration** — after Neon backup confirmation; schema only; no POST wiring.  
Then internal Production-server idempotency verification → later POST wiring.

Pagination caps remain a separate reconciliation blocker.

---

## 8. Build health

| Check | Result |
| --- | --- |
| Controlled + vercel-build unit tests | **27 PASS** |
| Hybrid + gate + controlled regression | **162 passed** |
| tsc | PASS |
| local-dry `--plan-only` on ljd_dev | PASS（pending=0） |
| Production Neon / deploy | **Not done** |

---

## 9. Verdicts

| Question | Answer |
| --- | --- |
| Fully separate migrate from Production build? | **A** |
| Controlled migration runbook as A? | **A** |
| Proceed to Production DB migration Phase now? | **B**（needs backup confirmation first） |
| Neon backup/restore user confirmation required first? | **A** |
| Internal Production-server wiring next? | **A**（design/plan after or parallel to V.1；execute after schema） |
| Production POST wiring now? | **B** |
| main merge? | **No** |
