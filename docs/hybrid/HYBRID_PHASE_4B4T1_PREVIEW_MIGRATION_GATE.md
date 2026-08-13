# Hybrid Phase 4B-4T.1｜Preview Migration Gate Implementation

**Status:** Implementation PASS（T1–T5 + Preview build health）  
**Branch:** `fix/vercel-preview-migration-gate`  
**Base:** `docs/vercel-database-migration-safety` @ `e770390482b795fcf702f85a89bc6416bb7a90b2`（includes 4B-4S @ `63ec015`）  
**Date:** 2026-08-13  

**Companions:**
- [HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md](./HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md)
- [ljd-database-migration-deployment-safety-spec.md](../product/ljd-database-migration-deployment-safety-spec.md)
- [HYBRID_PHASE_4B4O1_PREVIEW_BUILD_HEALTH.md](./HYBRID_PHASE_4B4O1_PREVIEW_BUILD_HEALTH.md)
- [HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md](./HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**Production deploy this Phase:** **No**  
**Vercel Dashboard env changes:** **No**  
**`prisma/migrations/` JournalSaveOperation:** **Not added**

---

## 1. Goal

With Dashboard evidence that `DATABASE_URL` is scoped to **Production and Preview** (shared setting), stop Preview builds from running `prisma migrate deploy` so feature-branch Previews cannot mutate the shared Production DB schema.

---

## 2. Dashboard fact (no secrets)

| Item | Result |
| --- | --- |
| `DATABASE_URL` Vercel scope | **Production and Preview**（同一 Environment Variable 設定） |
| Secret value | Not recorded / not shared |
| Host/DB name equality by value | Not separately fingerprinted |
| Migration-safety treatment | **Shared** — Preview build must not migrate |

This is stronger than “isolation Unknown”: the **same env var binding** applies to both scopes. Treat as shared for migration design even without printing the connection string.

---

## 3. Implementation

| Piece | Path / value |
| --- | --- |
| Gate runner | `scripts/vercel-build.mjs` |
| Tests | `scripts/vercel-build.test.ts`（T1–T5 + dry harness） |
| `vercel.json` | still `npm run build:vercel`（unchanged entry） |
| `build:vercel` | `node scripts/vercel-build.mjs`（reads `VERCEL_ENV`） |
| `build:vercel:preview` | `--vercel-env=preview`（explicit; no migrate） |
| `build:vercel:production` | `--vercel-env=production`（migrate selected） |
| `build:vercel:plan` | `--plan-only`（print plan only） |

### Behavior

| `VERCEL_ENV` | `prisma generate` | `prisma migrate deploy` | `next build` |
| --- | --- | --- | --- |
| `production` | yes | **yes** | yes |
| `preview` | yes | **no** | yes |
| `development` | yes | **no** | yes |
| unset | yes | **no**（fail-safe） | yes |
| unknown | yes | **no**（fail-safe） | yes |

Only exact (case-insensitive) `production` enables migrate. Unknown/unset never migrates — safer than guessing Production.

Commands use `spawnSync(..., { shell: false })` — Mac / Vercel Linux safe; no shell interpolation of secrets.

---

## 4. Tests

| Case | Result |
| --- | --- |
| T1 preview → no migrate | PASS |
| T2 production → migrate step selected（fake harness; **no Neon**） | PASS |
| T3 development → no migrate | PASS |
| T4 unset → no migrate | PASS |
| T5 unknown → no migrate | PASS |

### Build health

| Check | Result |
| --- | --- |
| tsc | PASS |
| Gate + Hybrid regression | **144 passed** |
| `prisma generate` + `next build`（Preview 相当・migrate なし） | PASS |
| Production deploy / Neon schema / Vercel env | Unchanged |

---

## 5. What this does / does not unlock

| Unlocks | Still blocked |
| --- | --- |
| Preview builds safe against shared `DATABASE_URL` schema mutation via migrate | Official `JournalSaveOperation` → `prisma/migrations/`（separate promotion Phase） |
| Strategy B short-term path implemented | Production POST wiring |
| | Separate Preview DB（Strategy D） optional later |
| | Long-term migrate-out-of-build（Strategy C） |

Promotion next: **possible to evaluate** after this gate is on the deploy path; still require additive migration review + feature-unwired deploy order. This Phase does **not** promote.

---

## 6. Verdicts

| Question | Answer |
| --- | --- |
| Preview migration gate as A? | **A** |
| Official JournalSaveOperation migration promotion next? | **A（評価可）** — gate PASS 後の別 Phase；本 Phase では未追加 |
| Production POST wiring now? | **B** |
| main merge? | **No** |

---

## 7. Forbidden confirmation

No Production deploy, no Preview migrate execution against Neon, no Vercel env change, no official migration add, no POST wiring, no main merge.
