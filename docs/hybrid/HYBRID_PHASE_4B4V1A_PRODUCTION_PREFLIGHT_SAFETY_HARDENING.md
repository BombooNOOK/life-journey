# Hybrid Phase 4B-4V.1a｜Production Read-only Preflight Safety Hardening

**Status:** Snapshot Gate **code-enforced**; read-only preflight command added；Production DB connect / migrate **not** done  
**Branch:** `fix/production-migration-preflight-hardening`  
**Base:** `docs/controlled-production-migration-runbook` @ `7968117`  
**Date:** 2026-08-13  

**Parent:** [HYBRID_PHASE_4B4V_CONTROLLED_PRODUCTION_MIGRATION.md](./HYBRID_PHASE_4B4V_CONTROLLED_PRODUCTION_MIGRATION.md)  
**Runbook:** [ljd-production-database-migration-runbook.md](../product/ljd-production-database-migration-runbook.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**Production Neon connect / migrate / Snapshot API mutate / deploy / POST / main merge:** **No**

---

## 1. Why

4B-4V.1 Preflight で:

- Production DB identity 未確認（local `DATABASE_URL` のみ）
- `PRE_SNAPSHOT_*` が **runbook-only**（controlled migrate script 未強制）

のため Production migration は引き続き禁止。本 Phase は **hardening only**。

---

## 2. Snapshot Gate（code）

`scripts/lib/productionMigrateSafety.mjs` → `assertPreSnapshotGates` / `assertOperatorGates`

Production mode of `controlled-production-migrate.mjs` は以下が揃うまで **`prisma migrate deploy` に到達しない**:

| Env | Value |
| --- | --- |
| `LJD_PRODUCTION_MIGRATION_PRE_SNAPSHOT_REQUIRED` | `YES` |
| `LJD_PRODUCTION_PRE_SNAPSHOT_CREATED` | `YES` |
| `LJD_PRODUCTION_PRE_SNAPSHOT_AT` | non-secret timestamp metadata |

確認済み Snapshot（operator・非 secret）:

- **2026-08-13 06:43:21 UTC**（例: `2026-08-13T06:43:21Z`）
- ~43.1MB / manual / expires never  

Snapshot 自体の API 操作・変更は行わない。

---

## 3. Read-only preflight（migrate と分離）

| Piece | Path |
| --- | --- |
| Command | `npm run db:preflight:production` |
| Script | `scripts/production-preflight.mjs` |

**構造的保証:** preflight は `prisma migrate deploy` を import / spawn しない。

実施可能なのは read-only のみ:

- DB fingerprint（redacted）
- `prisma migrate status` + pending 一覧
- JournalEntry count / donguri 関連 count
- `JournalSaveOperation` table 存在確認
- schema metadata via status

---

## 4. Production URL fail-closed

- **明示変数のみ:** `PRODUCTION_DATABASE_URL`
- **禁止:** local `DATABASE_URL` を Production 代用
- unset → reject
- localhost / `127.0.0.1:5433/ljd_dev` を Production 指定 → reject

---

## 5. Secret safety

- full URL / password を log しない
- shell output は `redactSecretsInText`
- Production URL を repo `.env` に保存しない（本 Phase でも未保存）

---

## 6. Tests covered

- Production URL なし → reject
- localhost を Production 指定 → reject
- Snapshot Gate なし → migration command reject（deploy 未到達）
- backup Gate なし → reject
- wrong fingerprint → reject
- read-only preflight から migrate deploy が呼ばれない

---

## 7. Build health（this Phase）

| Check | Result |
| --- | --- |
| controlled-production-migrate.test.ts | **34 PASS** |
| Hybrid + vercel-build + controlled | **232 passed** / 2 skipped |
| tsc --noEmit | PASS |
| next build | PASS |
| Production DB connect | **No** |
| Production migrate | **No** |

---

## 8. Verdicts

| Question | Answer |
| --- | --- |
| Snapshot Gate code-enforced? | **A** |
| Proceed to Production **read-only** preflight next? | **A** once operator supplies `PRODUCTION_DATABASE_URL` (session env; not committed) |
| Proceed to Production **migration** now? | **B** |
| Production DB connected this Phase? | **No** |
| main merge? | **No** |
