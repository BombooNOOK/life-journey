/**
 * Life Journey Diary｜Production Database Migration Runbook
 *
 * Status: Pre-Implementation Controlled Production Migration Runbook / Source of Truth Candidate
 * Updated: 2026-08-13
 * Branch: docs/controlled-production-migration-runbook
 * Base: feat/official-journal-save-operation-migration @ e85b982
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: runbook + local-dry guards. No Production Neon migrate. No Production deploy.
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4V_CONTROLLED_PRODUCTION_MIGRATION.md
 * - docs/hybrid/HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md
 * - docs/hybrid/HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md
 * - docs/hybrid/HYBRID_PHASE_4B4U_OFFICIAL_JOURNAL_SAVE_OPERATION_MIGRATION.md
 * - docs/product/ljd-database-migration-deployment-safety-spec.md
 */

# Life Journey Diary｜Production Database Migration Runbook

**Status:** Pre-Implementation Controlled Production Migration Runbook / Source of Truth Candidate  
**ラベル:** **Designed + local-dry implemented**／**Forbidden now**＝Production Neon apply／**Next**＝4B-4V.1 after backup confirmation

**絶対条件:** migration と application behavior 変更を同時にしない。feature OFF のまま schema のみ先に進める。

---

## 0. 一文

Vercel application build は **一切** `prisma migrate deploy` を実行しない（Strategy C）。Production schema 変更は operator が controlled command で、identity / confirmation / pending allowlist / backup Gate を満たしたときだけ行う。

---

## 1. Long-term sequence（正式）

```
1. controlled migration（本 runbook）
2. schema verification
3. application deploy（JournalSaveOperation / idempotency feature OFF）
4. internal verification
5. feature wiring（別 Phase・別判断）
```

---

## 2. Build vs controlled command

| Path | Migrate? |
| --- | --- |
| `npm run build:vercel`（Preview / Production） | **Never** |
| `postinstall` / `next build` / `npm run dev` | **Never** |
| `scripts/controlled-production-migrate.mjs` | Only after gates |

npm aliases:

- `db:migrate:controlled:plan` — local-dry plan  
- `db:migrate:controlled:local-dry` — local-dry apply（ljd_dev only）  
- `db:migrate:controlled:production:plan` — production **plan only**（still requires production gates; 4B-4V では Neon に対して実行しない）

単なる `prisma migrate deploy` alias は **不十分**（guard なし）。

---

## 3. Operator gates（Production）

すべて必須。不完全一致は fail。

| Env / flag | Value | Role |
| --- | --- | --- |
| `LJD_CONTROLLED_MIGRATE_MODE` | `production` | explicit production mode |
| `LJD_ALLOW_PRODUCTION_MIGRATION` | `YES` | human confirmation token（secret ではない・CI 常設禁止） |
| `LJD_PRODUCTION_BACKUP_CONFIRMED` | `YES` | backup/restore capability 確認済み Gate（V3） |
| `LJD_EXPECTED_DB_FINGERPRINT` | 16-hex | redacted identity fingerprint match（V1） |
| `LJD_EXPECTED_PENDING_MIGRATIONS` | comma list | pending 全件と完全一致（V2） |
| `DATABASE_URL` | （operator 環境） | ログにフル URL / password を出さない |

Fingerprint は `sha256(host\|port\|database).slice(0,16)`。label は redacted host/db のみ。

---

## 4. Plan（schema mutation なし）

Prisma に「deploy dry-run」は **無い**。本実行前に実在機能で確認:

1. `prisma migrate status` → pending 名を列挙  
2. SQL review: `prisma/migrations/<name>/migration.sql`  
3. target fingerprint / label 表示  
4. `LJD_EXPECTED_PENDING_MIGRATIONS` と完全一致するまで停止  

**推測禁止:** 「今回の1件だけが走る」とは限らない。`migrate deploy` は **pending 全件**を適用し得る。

今回の候補名: `20260813140000_add_journal_save_operation`  
→ allowlist に **他の unexpected pending が無いこと**を確認してから実行。

---

## 5. Backup Gate（実行前・必須）

Production migration **前**に Neon backup / restore capability が利用可能であることをユーザーが確認し、`LJD_PRODUCTION_BACKUP_CONFIRMED=YES` を明示する。

- 本 Phase（4B-4V）では backup **実行しない**  
- 確認なしで 4B-4V.1 Production apply へ進まない  

---

## 6. Pre / post verification（metadata のみ）

本文・写真・secret を出力しない。

| Check | Pre | Post |
| --- | --- | --- |
| migrate status | pending list | up to date / applied |
| `JournalSaveOperation` exists | no（想定） | yes |
| columns / unique / index | — | match schema |
| JournalEntry count | N | N（不変） |
| Donguri ledger count | M | M（不変） |

---

## 7. Feature OFF 保証

migration 成功後も production POST / save は `JournalSaveOperation` を使わない。  
table 存在だけでは既存 LJD save 挙動は変わらない（未配線）。

問題時: **feature OFF 維持 + forward-fix**（安易な down migration 禁止）。

---

## 8. Failure matrix

| Id | Case | Action |
| --- | --- | --- |
| V1 | DB identity / fingerprint mismatch | 実行禁止 |
| V2 | unexpected pending migrations | 停止（allowlist 修正 or 調査） |
| V3 | backup capability 未確認 | 停止 |
| V4 | migrate command failure | **app deploy しない** |
| V5 | migrate OK / schema verify fail | feature OFF 維持・調査 |
| V6 | migrate OK / app deploy fail | additive schema → 既存 app 継続可能か確認；feature OFF |

---

## 9. Forward-fix

`JournalSaveOperation` migration は additive（new table + indexes、既存 DROP なし）。  
Production issue → down ではなく feature OFF + 修正 migration。

---

## 10. Next Phase（4B-4V.1）— 今回やらない

ユーザー明示確認の上:

1. Neon backup/restore 確認記録  
2. Production fingerprint 記録  
3. pending allowlist 確定  
4. controlled **production** migrate（schema only）  
5. verification  
6. **Still no** production POST wiring  

---

## 11. Pagination

list/calendar/year caps（4B-4S）は reconciliation rollout blocker。schema migration は止めない。
