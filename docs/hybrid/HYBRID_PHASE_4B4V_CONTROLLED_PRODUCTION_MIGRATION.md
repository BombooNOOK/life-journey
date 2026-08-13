# Hybrid Phase 4B-4V｜Controlled Production Migration Architecture & Runbook

**Status:** Architecture + local-dry harness PASS；Backup capability Gate **PASS = A**；operator Snapshot **created**；Snapshot Gate **code-enforced in 4B-4V.1a**；Production Neon migrate **not** done  
**Branch:** `docs/controlled-production-migration-runbook`（hardening: `fix/production-migration-preflight-hardening`）  
**Base:** `feat/official-journal-save-operation-migration` @ `e85b982d838cc7d9e6625d18c0e834372de26c19`  
**Date:** 2026-08-13  

**Parent SoT:** [ljd-production-database-migration-runbook.md](../product/ljd-production-database-migration-runbook.md)

**Cross-links:**
- [HYBRID_PHASE_4B4V1A_PRODUCTION_PREFLIGHT_SAFETY_HARDENING.md](./HYBRID_PHASE_4B4V1A_PRODUCTION_PREFLIGHT_SAFETY_HARDENING.md)
- [HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md](./HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md)
- [HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md](./HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md)
- [HYBRID_PHASE_4B4U_OFFICIAL_JOURNAL_SAVE_OPERATION_MIGRATION.md](./HYBRID_PHASE_4B4U_OFFICIAL_JOURNAL_SAVE_OPERATION_MIGRATION.md)
- [ljd-database-migration-deployment-safety-spec.md](../product/ljd-database-migration-deployment-safety-spec.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**Production Neon migrate / deploy / POST:** **No**（Snapshot create = operator done；live Production connect = not in 4B-4V.1a）

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
| Shared safety | `scripts/lib/productionMigrateSafety.mjs` |
| Runner | `scripts/controlled-production-migrate.mjs` |
| Read-only preflight | `scripts/production-preflight.mjs` |
| Tests | `scripts/controlled-production-migrate.test.ts` |
| npm | `db:preflight:production` / `db:migrate:controlled:plan` / `:local-dry` / `:production:plan` |

Gates: mode, allow=`YES`, backup capability=`YES`, **pre-snapshot required/created/at（code）**, fingerprint, pending allowlist.  
Production URL: **`PRODUCTION_DATABASE_URL` only**（no `DATABASE_URL` substitute）.  
No full URL/password logs.  
Not hooked from build / postinstall / dev.

Prisma realities: `migrate status` + `migrate deploy` only — **no** invented dry-run deploy.

---

## 3. Pending migrations rule

`migrate deploy` applies **all** pending.  
Operator must set `LJD_EXPECTED_PENDING_MIGRATIONS` to the **exact** pending set after `migrate status`.  
Candidate name: `20260813140000_add_journal_save_operation` — do not assume it is alone.

---

## 4. Backup & Restore / Snapshot Gates

### 4.1 Capability（V3）— **PASS = A**

Neon Dashboard 実測（ユーザー報告・secret 非記載）:

| Item | Result |
| --- | --- |
| Branch | production |
| Restore from history | available |
| PITR / history window | **6 hours** |
| Manual Snapshot | creatable |
| Current Snapshot | **none** |
| Snapshot schedule | not on current plan / upgrade |

→ `LJD_PRODUCTION_BACKUP_CONFIRMED=YES` を capability として満たしてよい。

### 4.2 Pre-migration Snapshot — **必須・code enforced（4B-4V.1a）**

| Flag | Meaning |
| --- | --- |
| `LJD_PRODUCTION_MIGRATION_PRE_SNAPSHOT_REQUIRED=YES` | Snapshot Gate 有効（**code**） |
| `LJD_PRODUCTION_PRE_SNAPSHOT_CREATED=YES` | 手動 Snapshot 作成・確認済み（**code**） |
| `LJD_PRODUCTION_PRE_SNAPSHOT_AT` | non-secret timestamp（例 `2026-08-13T06:43:21Z`） |

Operator Snapshot: **2026-08-13 06:43:21 UTC** / ~43.1MB / manual / never expire.  
**未設定時は `prisma migrate deploy` に到達しない。** Production migrate 自体は未実施。

### 4.3 Path

```
hardening (4B-4V.1a) → read-only preflight (PRODUCTION_DATABASE_URL) → STOP
→ user explicit OK → only then Production migrate
```

---

## 5. Failure matrix V1–V6（+ V3b）

See runbook §8. V3b = pre-snapshot missing → refuse migrate.

---

## 6. Feature OFF

Table may exist after migrate; production save still unwired → existing LJD behavior unchanged.  
Forward-fix over down migration.

---

## 7. Next

| Step | Allowed now? |
| --- | --- |
| Operator: create manual Snapshot | **A（済）** |
| Production **read-only** preflight | **A** after `PRODUCTION_DATABASE_URL` in session env |
| 4B-4V.1 Production schema migration | **B** until identity confirmed + user OK |
| Production POST wiring | **B** |

Pagination caps remain a separate reconciliation blocker.

---

## 8. Build health

| Check | Result |
| --- | --- |
| Controlled + preflight + vercel-build unit tests | See 4B-4V.1a |
| Hybrid + gate + controlled regression | **232 passed**（2 skipped integration） |
| tsc | PASS |
| next build | PASS |
| Production Neon connect / migrate / deploy | **Not done** |

---

## 9. Verdicts（updated）

| Question | Answer |
| --- | --- |
| Fully separate migrate from Production build? | **A** |
| Controlled migration runbook as A? | **A** |
| Backup/Restore capability Gate | **A（PASS）** |
| Proceed to Snapshot creation（operator）? | **A（済）** |
| Proceed to Production **read-only** preflight? | **A**（session `PRODUCTION_DATABASE_URL`） |
| Proceed to Production migration execution now? | **B** |
| Internal Production-server wiring next? | after V.1 schema |
| Production POST wiring now? | **B** |
| main merge? | **No** |
