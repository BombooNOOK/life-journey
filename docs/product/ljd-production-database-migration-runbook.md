/**
 * Life Journey Diary｜Production Database Migration Runbook
 *
 * Status: Pre-Implementation Controlled Production Migration Runbook / Source of Truth Candidate
 * Updated: 2026-08-13（Neon Backup & Restore Dashboard 実測追記）
 * Branch: docs/controlled-production-migration-runbook
 * Base: feat/official-journal-save-operation-migration @ e85b982
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: runbook + local-dry guards. No Production Neon migrate. No Snapshot create.
 *        No Production deploy. No POST wiring. No main merge.
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
**ラベル:** **Designed + local-dry implemented**／**Backup capability Gate = A（実測）**／**Pre-snapshot Gate = 必須・未作成**／**Forbidden now**＝Production migrate / Snapshot create（本更新では未実施）

**絶対条件:** migration と application behavior 変更を同時にしない。feature OFF のまま schema のみ先に進める。  
**絶対条件:** 手動 Snapshot 作成確認前は Production migration **禁止**。

---

## 0. 一文

Vercel application build は **一切** `prisma migrate deploy` を実行しない（Strategy C）。Production schema 変更は operator が controlled command で、identity / confirmation / pending allowlist / backup capability / **migration直前手動 Snapshot** を満たしたときだけ行う。

---

## 1. Long-term sequence（正式）

```
1. controlled migration（本 runbook）
2. schema verification
3. application deploy（JournalSaveOperation / idempotency feature OFF）
4. internal verification
5. feature wiring（別 Phase・別判断）
```

### 1.1 Immediate path to 4B-4V.1（ユーザー確定）

まだ Production migrate は行わない。次の順序のみ:

```
1. Production DB の migration 前 metadata 確認（status / pending / fingerprint 等）
2. Neon Dashboard で手動 Snapshot を 1 つ作成
3. Snapshot が正常に作成されたことを確認
4. そこで一度停止
5. ユーザー明示確認後にのみ 4B-4V.1 Production Schema Migration へ進む
```

本 docs 更新時点では **1–5 いずれも未実施**（Backup capability の Dashboard 確認のみ完了）。

---

## 2. Build vs controlled command

| Path | Migrate? |
| --- | --- |
| `npm run build:vercel`（Preview / Production） | **Never** |
| `postinstall` / `next build` / `npm run dev` | **Never** |
| `scripts/controlled-production-migrate.mjs` | Only after gates |

npm aliases:

- `db:preflight:production` — **read-only** Production preflight（`PRODUCTION_DATABASE_URL` only；`migrate deploy` 不可）  
- `db:migrate:controlled:plan` — local-dry plan  
- `db:migrate:controlled:local-dry` — local-dry apply（ljd_dev only）  
- `db:migrate:controlled:production:plan` — production **plan only**（full production gates；Neon apply は別途明示承認まで禁止）

単なる `prisma migrate deploy` alias は **不十分**（guard なし）。

---

## 3. Operator gates（Production）

すべて必須。不完全一致は fail。**4B-4V.1a で controlled migrate script が code 強制**（runbook のみではない）。

| Env / flag | Value | Role |
| --- | --- | --- |
| `LJD_CONTROLLED_MIGRATE_MODE` | `production` | explicit production mode |
| `LJD_ALLOW_PRODUCTION_MIGRATION` | `YES` | human confirmation token（secret ではない・CI 常設禁止） |
| `LJD_PRODUCTION_BACKUP_CONFIRMED` | `YES` | backup/restore **capability** 確認済み（V3）— **Dashboard 実測 PASS** |
| `LJD_PRODUCTION_MIGRATION_PRE_SNAPSHOT_REQUIRED` | `YES` | migration直前手動 Snapshot 必須 Gate（**code**） |
| `LJD_PRODUCTION_PRE_SNAPSHOT_CREATED` | `YES` | 当該 Snapshot 作成・確認済み（未作成なら migrate 禁止・**code**） |
| `LJD_PRODUCTION_PRE_SNAPSHOT_AT` | ISO/UTC timestamp | non-secret Snapshot metadata（例 `2026-08-13T06:43:21Z`） |
| `LJD_EXPECTED_DB_FINGERPRINT` | 16-hex | redacted identity fingerprint match（V1） |
| `LJD_EXPECTED_PENDING_MIGRATIONS` | comma list | pending 全件と完全一致（V2） |
| `PRODUCTION_DATABASE_URL` | （operator session env） | Production 専用。**`DATABASE_URL` 代用禁止**。repo `.env` に保存しない |

Fingerprint は `sha256(host\|port\|database).slice(0,16)`。label は redacted host/db のみ。フル URL / password は log しない。

**Confirmed operator Snapshot（非 secret）:** `2026-08-13 06:43:21 UTC` / ~43.1MB / manual / expires never。Snapshot API 操作はしない。

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

## 5. Backup & Restore Gate（Dashboard 実測）

### 5.1 Capability Gate — **PASS = A**

ユーザー Neon Dashboard 実測（secret / 接続文字列は非記載）:

| Item | Result |
| --- | --- |
| 対象 branch | **production** |
| Restore from history | **利用可能** |
| History window（point-in-time） | **過去 6 時間** |
| 手動 Snapshot | **作成可能** |
| 現在の Snapshot | **なし** |
| Snapshot schedule | 現プランでは未設定／Upgrade 対象 |

したがって 4B-4V の V3「Production DB の backup / restore capability が実際に存在し利用可能」は **PASS = A**。

`LJD_PRODUCTION_BACKUP_CONFIRMED=YES` を capability 確認済みとして扱ってよい。

### 5.2 Pre-migration Snapshot Gate — **必須・code enforced（4B-4V.1a）**

Capability PASS だけでは Production migrate 不可。

**必須 precondition:**

1. migration 直前に Neon Dashboard から **手動 Snapshot を 1 つ作成**  
2. Snapshot が正常に作成されたことを確認  
3. `LJD_PRODUCTION_MIGRATION_PRE_SNAPSHOT_REQUIRED=YES`  
4. `LJD_PRODUCTION_PRE_SNAPSHOT_CREATED=YES`  
5. `LJD_PRODUCTION_PRE_SNAPSHOT_AT=<timestamp>`（例: `2026-08-13T06:43:21Z`）  

**未設定時は controlled migrate が `prisma migrate deploy` に到達しない。**

本更新時点:

- Restore 実行: **していない**  
- Snapshot Create: **済み**（`2026-08-13 06:43:21 UTC`）  
- Production migration: **していない**  
- Production read-only preflight（live）: **未実施**（URL 未供給）  

6 時間 history window があるため、migrate 実行はその window と手動 Snapshot の両方を意識する。

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
| V3 | backup capability 未確認 | 停止（**現時点 capability は PASS**） |
| V3b | pre-migration Snapshot 未作成 / 未確認 | **Production migrate 禁止** |
| V4 | migrate command failure | **app deploy しない** |
| V5 | migrate OK / schema verify fail | feature OFF 維持・調査 |
| V6 | migrate OK / app deploy fail | additive schema → 既存 app 継続可能か確認；feature OFF |

---

## 9. Forward-fix

`JournalSaveOperation` migration は additive（new table + indexes、既存 DROP なし）。  
Production issue → down ではなく feature OFF + 修正 migration。必要なら Snapshot / PITR（6h）を recovery 候補として評価。

---

## 10. Next Phase（4B-4V.1）— 条件

**今は進まない。** 4B-4V.1 に進める条件:

| # | 条件 | 現状 |
| --- | --- | --- |
| 1 | Backup/Restore capability Gate | **PASS = A** |
| 2 | Production migration 前 metadata 確認 | 未 |
| 3 | 手動 Snapshot 作成 + 正常確認 | 未 |
| 4 | ユーザー明示「4B-4V.1 へ進め」 | 未 |
| 5 | fingerprint / pending allowlist | 未（V.1 時） |
| 6 | controlled production migrate | **禁止 until 1–4** |
| 7 | production POST wiring | **別 Phase・禁止** |

ユーザー操作の次ステップ候補: **Snapshot 作成のみ**（migrate はまだ禁止）。

---

## 11. Pagination

list/calendar/year caps（4B-4S）は reconciliation rollout blocker。schema migration は止めない。
