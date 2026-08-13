/**
 * Life Journey Diary｜Database Migration Deployment Safety Spec
 *
 * Status: Pre-Implementation Database Migration Deployment Safety / Source of Truth Candidate
 * Updated: 2026-08-13（4B-4T.1: Dashboard shared DATABASE_URL + Preview migrate gate）
 * Branch: fix/vercel-preview-migration-gate
 * Base: docs/vercel-database-migration-safety @ e770390
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: safety design + Preview migration gate implementation notes.
 *        No Vercel env var changes, no official JournalSaveOperation migration,
 *        no Production deploy, no main merge.
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md
 * - docs/hybrid/HYBRID_PHASE_4B4T1_PREVIEW_MIGRATION_GATE.md
 * - docs/hybrid/HYBRID_PHASE_4B4V_CONTROLLED_PRODUCTION_MIGRATION.md
 * - docs/product/ljd-production-database-migration-runbook.md
 * - docs/hybrid/HYBRID_PHASE_4B4U_OFFICIAL_JOURNAL_SAVE_OPERATION_MIGRATION.md
 * - docs/hybrid/HYBRID_PHASE_4B4P_NONPROD_PRISMA_IDEMPOTENCY_INTEGRATION.md
 * - docs/hybrid/HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md
 * - docs/hybrid/HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md
 * - docs/product/ljd-journal-save-idempotency-spec.md
 * - docs/product/ljd-lightweight-create-reconciliation-spec.md
 */

# Life Journey Diary｜Database Migration Deployment Safety Spec

**Status:** Source of Truth Candidate（4B-4T/T.1 + 4B-4U migration + **4B-4V Strategy C build separation**）  
**ラベル:** **Implemented**＝Preview gate + build-never-migrates + controlled command local-dry／**Shared DATABASE_URL**／**Forbidden now**＝Production Neon apply／**Next**＝4B-4V.1 after backup confirm

**絶対条件:** Preview は Production DB へ schema mutation しない。

---

## 0. 一文

Vercel Dashboard 実測で `DATABASE_URL` が **Production and Preview** 共通設定のため、migration 安全設計上は **shared** と扱う。  
`build:vercel` は **一切** `prisma migrate deploy` を実行しない（4B-4V Strategy C）。Production schema 変更は controlled command のみ。

---

## 1. 現在の migration 実行経路（repo 監査・推測禁止）

### 1.1 Vercel build（本番経路）

| 項目 | 事実（コード/設定） |
| --- | --- |
| `vercel.json` `buildCommand` | `npm run build:vercel` |
| `package.json` `build:vercel` | `node scripts/vercel-build.mjs`（4B-4T.1） |
| Preview（`VERCEL_ENV=preview`） | `prisma generate && next build` — **migrate なし** |
| Production（`VERCEL_ENV=production`） | `prisma generate && next build` — **migrate なし**（4B-4V） |
| unset / unknown / development | **migrate なし** |
| Controlled migrate | `scripts/controlled-production-migrate.mjs`（operator-only） |
| 対象 DB | Dashboard: `DATABASE_URL` = **Production and Preview** 共通設定（値は非記載） |
| 効果（gate 後） | Preview feature branch は共有 DB へ schema mutation しない |

明示スクリプト: `build:vercel:preview` / `build:vercel:production` / `build:vercel:plan`

### 1.2 その他経路

| 経路 | 内容 | 自動性 |
| --- | --- | --- |
| `postinstall` | `prisma generate` のみ（**migrate deploy なし**） | npm install 時 |
| `db:migrate:deploy` | `prisma migrate deploy` | 手動 |
| `db:local:sync` / `db:local:reset` | 明示 local `127.0.0.1:5433/ljd_dev` | 手動 / local |
| `db:push` / `db:sync` | `prisma db push`（migrate 履歴と別） | 手動・危険 |
| GitHub Actions / `.github/workflows` | **不在** | — |
| Neon branch automation in-repo | **記述なし・未導入と証明も不可** | 存在仮定禁止 |

### 1.3 結論（経路）

- **Preview build でも** `prisma migrate deploy` が走り得る（`vercel.json` が環境分岐していない）。  
- **Production build でも**同様。  
- CI 別経路での migrate は repo 上 **なし**。  
- 本 Phase はスクリプト変更しない（設計のみ）。

---

## 2. Vercel environment isolation（判定）

| Env | `DATABASE_URL` | 本 Phase の判定 |
| --- | --- | --- |
| Production | Dashboard: **Production and Preview** 共通設定 | **Shared with Preview**（値は非表示） |
| Preview | 同上 | **Shared with Production** |
| Development | ローカルは `ljd_dev` 方針（docs/DEV） | ローカル運用は別問題 |

**Dashboard 実測（ユーザー確認・secret 非共有）:**

- `DATABASE_URL` は **「Production and Preview」** に適用されている  
- 接続文字列の中身（host/db 値）までは表示していない  
- したがって「同一接続先」を fingerprint で証明したわけではないが、**同一 Environment Variable 設定が両 scope に適用**されているため、migration 安全設計上は **shared 扱い**

**安全側の扱い:** 分離済み Preview DB としては扱わない。  
4B-4T.1 の Preview migrate gate により、共有設定でも Preview build からの schema mutation を防ぐ。

`JournalSaveOperation` の `prisma/migrations/` 昇格は、gate 実装 PASS 後の **別 Phase** で条件再評価（本 Phase ではまだ追加しない）。

---

## 3. Strategy 比較

### Strategy A｜現状維持（全 deploy で migrate deploy）

`prisma generate && prisma migrate deploy && next build` を Preview/Production 共通。

| 観点 | 評価 |
| --- | --- |
| Preview → schema mutation | Isolation Unknown なら **Production 汚染リスク** |
| Feature branch migration | Preview ビルドのたびに未適用 migration が走り得る |
| Rollback | build 内 migrate 失敗 = deploy 失敗だが、**一部適用済み**の可能性は DB 側に残る |
| 本番候補 | **第一候補にしない** → 判定 **B（維持不可）** |

### Strategy B｜`VERCEL_ENV` gate（短期・4B-4T.1 実装）

実装: `scripts/vercel-build.mjs`

- Preview / 非 production: `prisma generate && next build`  
- Production only: `prisma generate && prisma migrate deploy && next build`  
- unset / unknown: **migrate なし**（fail-safe）

| 観点 | 評価 |
| --- | --- |
| Preview → Production mutation | 共有 `DATABASE_URL` でも Preview build は schema を触らない |
| Atomicity | migrate 成功 → next build 失敗の窓は Production に残る（Strategy C で改善） |
| 運用 | `vercel.json` は `build:vercel` のまま；責務は script 内で明示 |
| 位置づけ | **短期安全策 A — implemented（4B-4T.1）** |

### Strategy C｜migrate を build から完全分離（長期本命・4B-4V 実装）

実装: `scripts/controlled-production-migrate.mjs` + `scripts/production-preflight.mjs` + `vercel-build.mjs` never migrates.  
4B-4V.1a: Snapshot Gate **code-enforced**; Production URL = `PRODUCTION_DATABASE_URL` only; read-only preflight cannot call `migrate deploy`.

通常 Vercel build から `migrate deploy` を外し、controlled release:

1. migration（明示ステップ + gates）  
2. schema verification  
3. application deploy（feature OFF）  

| 観点 | 評価 |
| --- | --- |
| 安全性 | 最高（誰がいつ schema を変えるか明示） |
| 運用負荷 | 中（runbook / fingerprint / backup Gate） |
| 位置づけ | **長期本命 A — implemented in repo（Production apply still separate Phase）** |

Runbook: `docs/product/ljd-production-database-migration-runbook.md`

### Strategy D｜Preview 専用 DB

Preview ごと、または共有 Preview non-prod DB（Neon branch 等）。

| 観点 | 評価 |
| --- | --- |
| in-repo 導入状況 | **未証明・記載なし** → 存在仮定禁止 |
| 分離できても | feature branch からの **自動 migrate 可否は別問題**（壊れた migration が Preview を汚染し得る） |
| 位置づけ | Isolation 証明後の **補強候補**。単独では A の危険を消さない |

---

## 4. 推奨構成

### 短期（4B-4T.1）

1. **Preview から `prisma migrate deploy` を外す** — **implemented**（Strategy B）  
2. Dashboard: `DATABASE_URL` = Production and Preview → **shared 扱い確定**  
3. `prisma/migrations/` へ 4B-4P 候補の昇格は **別 Phase**（gate PASS 後に条件再評価）  
4. Preview build health: `prisma generate && next build` を維持（4B-4O.1）

### 長期（production migration 運用）

1. Strategy **C**: migrate を build 外の controlled release へ  
2. Strategy **D** で Preview 専用 DB（任意だが推奨；現状は未導入）  
3. expand → verify → wire feature（§6）

---

## 5. Official Prisma migration promotion 条件

4B-4P candidate: `prisma/poc/4b4p_journal_save_operation.sql`  
→ 正式 `prisma/migrations/` へ昇格してよいのは **すべて満たすときのみ**:

| # | 条件 | 4B-4T.1 時点 |
| --- | --- | --- |
| 1 | Migration deployment 経路が安全（少なくとも Preview が Production schema を mutation しない） | **gate で充足候補** |
| 2 | Preview/Production DB isolation 証明、**または** Preview migrate 無効化が実装済み | isolation は **shared**；migrate 無効化は **実装済み** |
| 3 | Local disposable `127.0.0.1:5433/ljd_dev` で正式 Prisma migration 再現 PASS | **4B-4U PASS**（fresh + upgrade） |
| 4 | Existing production schema への forward migration レビュー（additive） | SQL reviewed locally; Production apply still **B** |
| 5 | Data-destructive operation なし | **4B-4U SQL: none** |
| 6 | Rollback / forward-fix 方針が文書化されている | §7 |
| 7 | App は migration 適用直後も save behavior 非変更（feature flag / 未配線） | 必須 |

**現時点:** gate（1–2）は 4B-4T.1 で充足候補。正式 migration ファイルは **4B-4U で local 昇格済み**（`20260813140000_add_journal_save_operation`）。**Production Neon への apply は未実施** — §6 checklist + Strategy C 長期運用を推奨。

---

## 6. Production 適用順序（第一候補）

migration を入れた瞬間に production save behavior を変えない。

```
1. migration deployment path 安全化（B or C）
2. isolation 証明 or Preview migrate 無効
3. prisma/migrations/ へ JournalSaveOperation 昇格（additive）
4. migration 適用 + schema verification
5. app deploy（idempotency / save wiring **disabled**）
6. internal flag で Server operation 検証
7. production POST wiring（段階的）
8. Local intent + outbox + lightweight A の production 有効化は別ゲート
```

並行 blocker（別トラック）: list pagination（§8）。

---

## 7. Rollback / forward-fix

`JournalSaveOperation` は **新規テーブル候補**。

| 観点 | 評価 |
| --- | --- |
| 既存 `JournalEntry` | 候補 SQL は触らない（CREATE TABLE IF NOT EXISTS + indexes） |
| donguri / 既存 LJD | 非対象 |
| down migration | **production で安易に前提にしない** |
| 失敗時 | forward-fix（修正 migration）または未使用テーブルの放置＋app 未配線 |
| 設計 | **forward-only / additive** を第一候補 |

PoC SQL の rename `userId`→`actorKey` は local 残骸向け。正式 migration は **クリーンな CREATE** を推奨（レビュー時に確定）。

---

## 8. Pagination blocker との関係（4B-4S）

| Cap | 値 |
| --- | --- |
| calendar month | 400 |
| view=list | 200 |
| year | 500 |

- Production reconciliation **completeness** の Release Blocker **候補**  
- **Migration safety とは別 blocker**  
- 本 Phase で pagination **実装しない**  
- Rollout 前の順序候補: **migration path 安全化 → schema 昇格 →（配線前に）pagination 方針決定 → save wiring**  
  - pagination を migration より **先に必須実装**する必要はない（別軸）

---

## 9. main 統合戦略（今回 merge しない）

Hybrid chain は formal main 未統合。分離可能な段階:

| Stage | 内容 | main 投入の可否（設計） |
| --- | --- | --- |
| schema-only | migrations + generate; feature off | isolation/path 安全後に検討可 |
| feature disabled | コード同梱・flag off | schema-only 後 |
| internal enabled | internal/harness のみ | |
| rollout | production POST | 最終 |

**今回:** main merge **不可**。

---

## 10. Preview build health

4B-4O.1 復旧済み: `tsc` / `next build`。  
Preview から migrate を外しても **`prisma generate` は必要**（schema の `JournalSaveOperation` 型生成）。  
`generate && next build` で Preview health 維持可能（実測は過去 Phase で PASS）。

---

## 11. Forbidden now

Vercel env 変更、token による勝手な設定変更、Production/Preview Neon migration 適用、`prisma/migrations/` 追加、build script 変更、production deploy、production POST wiring、pagination 実装、main merge。

---

## 12. Next Phase 候補（実装は別）

1. ユーザー Dashboard isolation 記録  
2. Strategy B の build script 設計/実装 Phase（本 Phase では変更しない）  
3. 条件充足後に official migration promotion Phase  
4. 長期で Strategy C runbook
