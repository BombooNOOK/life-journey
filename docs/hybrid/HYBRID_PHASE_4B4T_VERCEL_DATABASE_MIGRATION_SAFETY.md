# Hybrid Phase 4B-4T｜Vercel Database Isolation & Prisma Migration Deployment Safety

**Status:** Architecture / audit PASS（docs only）  
**Branch:** `docs/vercel-database-migration-safety`  
**Base:** `feat/internal-lightweight-create-reconciliation-poc` @ `63ec015253fe30e41c23eb5aeab52883fc4b24e4`  
**Date:** 2026-08-13  

**Parent SoT:** [ljd-database-migration-deployment-safety-spec.md](../product/ljd-database-migration-deployment-safety-spec.md)

**Cross-links:**
- [HYBRID_PHASE_4B4P_NONPROD_PRISMA_IDEMPOTENCY_INTEGRATION.md](./HYBRID_PHASE_4B4P_NONPROD_PRISMA_IDEMPOTENCY_INTEGRATION.md)
- [HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md](./HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md)
- [HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md](./HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md)
- [HYBRID_PHASE_4B4O1_PREVIEW_BUILD_HEALTH.md](./HYBRID_PHASE_4B4O1_PREVIEW_BUILD_HEALTH.md)
- [ljd-lightweight-create-reconciliation-spec.md](../product/ljd-lightweight-create-reconciliation-spec.md)
- [ljd-journal-save-idempotency-spec.md](../product/ljd-journal-save-idempotency-spec.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**Code / env / deploy this Phase:** **none**

---

## 1. Purpose

Audit where `prisma migrate deploy` can run, assess Preview/Production DB isolation, and design safe promotion conditions for `JournalSaveOperation` — **without** applying migrations or changing Vercel.

Context: B+C+A recovery architecture is candidate **A**; production wiring remains blocked primarily by **official migration + unproven DB isolation**.

---

## 2. Build / migration path (repo facts)

| Source | Value |
| --- | --- |
| `vercel.json` | `"buildCommand": "npm run build:vercel"` |
| `package.json` | `"build:vercel": "prisma generate && prisma migrate deploy && next build"` |
| Preview | Same buildCommand → **migrate deploy can run** |
| Production | Same → **migrate deploy can run** |
| `postinstall` | `prisma generate` only |
| GitHub Actions | **None** in repo |
| Neon Preview branches | **Not evidenced** in repo |

---

## 3. Isolation verdict

| Question | Answer |
| --- | --- |
| Production vs Preview `DATABASE_URL` distinct? | **Unknown** |
| Evidence | Vercel CLI unavailable (`command not found`); no dashboard capture this Phase |
| Treat as isolated? | **No**（推測禁止） |

### Dashboard checklist for user（no secrets）

Record redacted fingerprints only for Production vs Preview:

- Env scope binding  
- Host fingerprint same/different  
- Database name fingerprint same/different  
- Neon same branch/DB or not  

Until **proven different** (or Preview migrate disabled in code), treat Preview as able to mutate Production schema if URLs are shared.

---

## 4. Strategy verdicts

| Strategy | Role | Verdict |
| --- | --- | --- |
| **A** All deploys migrate+build | Current | **B** — not production-safe candidate while isolation Unknown |
| **B** `VERCEL_ENV` gate（Preview: generate+build; Production: +migrate） | Short-term | **A（有力）** — implements absolute rule: Preview must not mutate Production schema via build |
| **C** Migrate outside Vercel build | Long-term | **A（本命）** — controlled release: migrate → verify → deploy |
| **D** Preview-only DB | Reinforcement | Useful **if introduced**; does not alone justify auto-migrate from every feature branch |

**絶対条件:** Preview は Production DB へ schema mutation しない。

---

## 5. Short-term vs long-term

| Horizon | Recommendation |
| --- | --- |
| Short | Strategy **B** design next（実装は別 Phase）+ Dashboard isolation 記録 |
| Long | Strategy **C** runbook; optional **D** Preview DB |

This Phase: **docs only** — no `package.json` / Vercel change.

---

## 6. Official migration promotion gate

Candidate: `prisma/poc/4b4p_journal_save_operation.sql`

Promote to `prisma/migrations/` only when path safety + isolation (or Preview migrate off) + local formal migrate reproduce + forward review + non-destructive + forward-fix policy + **feature still unwired**.

**Now:** **B**（do not promote）.

---

## 7. Production apply order（first candidate）

```
safe path → isolation proof or Preview migrate off
→ additive migration → verify
→ app deploy (idempotency disabled)
→ internal Server op verify
→ production save wiring
```

Do **not** change production save behavior at the instant of migration.

---

## 8. Rollback / forward-fix

New table only → existing JournalEntry / donguri / LJD unaffected by design.  
No easy down migration in production. Prefer **forward-fix**.

---

## 9. Pagination (4B-4S) vs this blocker

| Blocker | Track |
| --- | --- |
| migrate deploy on shared/unknown DB | **This Phase** |
| list caps 200/400/500 completeness | **Separate** reconciliation release gate |

Do not implement pagination here. Do not require pagination **before** migration-path hardening.

---

## 10. main integration

Possible later stages: schema-only → feature disabled → internal → rollout.  
**This Phase: no merge.**

---

## 11. Verdicts（完了判断）

| Question | Answer |
| --- | --- |
| Keep current migrate deploy && next build as-is? | **B** |
| Remove migration from Preview builds（方針 A）? | **A** |
| Proceed to official Prisma migration promotion next? | **B** |
| User Vercel Dashboard confirmation required first? | **A** |
| Implement pagination before migration work? | **B**（別 blocker；migration path 安全化を先に） |
| Production POST wiring now? | **B** |
| main merge? | **No** |

---

## 12. Forbidden confirmation

No Vercel env change, no Neon migrate, no `prisma/migrations/` add, no build script change, no deploy, no POST wiring, no pagination, no main merge. Working tree code unchanged（docs only）.
