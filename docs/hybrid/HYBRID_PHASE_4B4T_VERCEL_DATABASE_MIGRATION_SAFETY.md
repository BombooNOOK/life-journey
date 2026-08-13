# Hybrid Phase 4B-4T｜Vercel Database Isolation & Prisma Migration Deployment Safety

**Status:** Architecture PASS + Dashboard shared-URL fact; gate implemented in 4B-4T.1  
**Branch:** `docs/vercel-database-migration-safety` → continue `fix/vercel-preview-migration-gate`  
**Base:** `feat/internal-lightweight-create-reconciliation-poc` @ `63ec015253fe30e41c23eb5aeab52883fc4b24e4`  
**Date:** 2026-08-13  

**Parent SoT:** [ljd-database-migration-deployment-safety-spec.md](../product/ljd-database-migration-deployment-safety-spec.md)  
**Implementation:** [HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md](./HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md)

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
| `package.json`（4B-4T.1） | `"build:vercel": "node scripts/vercel-build.mjs"` |
| Preview | `VERCEL_ENV=preview` → generate + next build (**no migrate**) |
| Production | `VERCEL_ENV=production` → generate + migrate deploy + next build |
| unset / unknown | **no migrate**（fail-safe） |
| `postinstall` | `prisma generate` only |
| GitHub Actions | **None** in repo |
| Neon Preview branches | **Not evidenced** in repo |

---

## 3. Isolation verdict

| Question | Answer |
| --- | --- |
| Production vs Preview `DATABASE_URL` setting | **Shared** — Dashboard: scope **Production and Preview** |
| Secret value inspected? | **No**（非表示・非共有） |
| Host/DB fingerprint proof? | Not separately proven |
| Migration-safety treatment | **Shared** — Preview must not run migrate |
| Treat as isolated Preview DB? | **No** |

### Dashboard checklist（completed）

- Env scope binding: **Production and Preview**（同一設定）  
- Follow-up optional: redacted host fingerprints if splitting Preview DB later（Strategy D）

---

## 4. Strategy verdicts

| Strategy | Role | Verdict |
| --- | --- | --- |
| **A** All deploys migrate+build | Former default | **B** — unsafe with shared DATABASE_URL |
| **B** `VERCEL_ENV` gate | Short-term | **A — implemented（4B-4T.1）** |
| **C** Migrate outside Vercel build | Long-term | **A（本命）** |
| **D** Preview-only DB | Reinforcement | Still optional; not currently configured |

**絶対条件:** Preview は Production DB へ schema mutation しない。

---

## 5. Short-term vs long-term

| Horizon | Recommendation |
| --- | --- |
| Short | Strategy **B** — **done in 4B-4T.1** |
| Long | Strategy **C** runbook; optional **D** Preview DB |

See [HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md](./HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md).

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
| Remove migration from Preview builds（方針 A）? | **A**（4B-4T.1 implemented） |
| Proceed to official Prisma migration promotion next? | **A（評価可）** — gate 後の別 Phase；ファイルは未追加 |
| User Vercel Dashboard confirmation required first? | **Done**（shared Production and Preview） |
| Implement pagination before migration work? | **B** |
| Production POST wiring now? | **B** |
| main merge? | **No** |

---

## 12. Forbidden confirmation

4B-4T docs phase: no env/deploy.  
4B-4T.1: build gate only — still no Production deploy, no Vercel env change, no official JournalSaveOperation migration add, no main merge.
