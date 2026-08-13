/**
 * Life Journey Diary｜Database Migration Deployment Safety Spec
 *
 * Status: Pre-Implementation Database Migration Deployment Safety / Source of Truth Candidate
 * Updated: 2026-08-13
 * Branch: docs/vercel-database-migration-safety
 * Base: feat/internal-lightweight-create-reconciliation-poc @ 63ec015
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: design / audit only. No Vercel env change, no migrate apply,
 *        no prisma/migrations/ promotion, no build script change, no deploy, no main merge.
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4T_VERCEL_DATABASE_MIGRATION_SAFETY.md
 * - docs/hybrid/HYBRID_PHASE_4B4P_NONPROD_PRISMA_IDEMPOTENCY_INTEGRATION.md
 * - docs/hybrid/HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md
 * - docs/hybrid/HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md
 * - docs/product/ljd-journal-save-idempotency-spec.md
 * - docs/product/ljd-lightweight-create-reconciliation-spec.md
 */

# Life Journey Diary｜Database Migration Deployment Safety Spec

**Status:** Pre-Implementation Database Migration Deployment Safety / Source of Truth Candidate  
**ラベル:** **Designed candidate**＝短期/長期方針／**Unknown**＝未証明 isolation／**Forbidden now**＝昇格・deploy・env 変更／**Release Gate**＝isolation 証明後

**絶対条件:** Preview は Production DB へ schema mutation しない。

---

## 0. 一文

`build:vercel` が全 Vercel deployment で `prisma migrate deploy` を実行し得る現状では、Preview/Production の `DATABASE_URL` 分離が未証明のまま `prisma/migrations/` へ候補テーブルを昇格してはならない。

---

## 1. 現在の migration 実行経路（repo 監査・推測禁止）

### 1.1 Vercel build（本番経路）

| 項目 | 事実（コード/設定） |
| --- | --- |
| `vercel.json` `buildCommand` | `npm run build:vercel` |
| `package.json` `build:vercel` | `prisma generate && prisma migrate deploy && next build` |
| 適用範囲 | Vercel 上の **Production および Preview** デプロイ（同一 buildCommand） |
| 対象 DB | そのデプロイに紐づく env の `DATABASE_URL`（値は本 Phase で未確認） |
| 効果 | `prisma/migrations/` 配下の未適用 migration が **deploy 先 DB に適用**される |

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

| Env | `DATABASE_URL` isolation | 本 Phase の判定 |
| --- | --- | --- |
| Production | Dashboard / CLI 未確認 | **Unknown** |
| Preview | Dashboard / CLI 未確認 | **Unknown** |
| Development | ローカルは `ljd_dev` 方針（docs/DEV） | ローカル運用は別問題 |

**確認手段（本セッション）:**

- `vercel` CLI: **command not found**（認証・env 列挙不可）  
- in-repo に Preview/Production host 比較証跡なし（4B-4P 時点も未検証）  
- secret 値の取得・表示は禁止

**安全側の扱い:** Isolation **未証明** → **分離済みと推測しない**。  
`JournalSaveOperation` の `prisma/migrations/` 昇格は **ブロック継続**。

### 2.1 ユーザーが Vercel Dashboard で確認する項目（secret 非表示）

比較してよいのは redacted fingerprint のみ。

For **Production** / **Preview** /（あれば）**Development** それぞれ:

1. `DATABASE_URL` が **Environment = Production / Preview / Development** のどれに紐づくか  
2. Host の redacted 形（例: `ep-*****.ap-northeast-1.aws.neon.tech`）が **同一か別か**  
3. Database name（pathname）の redacted 形が **同一か別か**  
4. Neon 側で **同一 branch / 同一 database** か、Preview 専用か  
5. Preview 用に Neon branch / 別 project を用意しているか（**未導入なら「無い」と記録**）

結果テンプレ:

```
Production host fingerprint: …
Preview host fingerprint: …
Same host? yes/no
Same database name? yes/no
Isolation proven? yes/no/unknown
```

`yes` でない限り promotion **B**。

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

### Strategy B｜`VERCEL_ENV` gate（短期有力）

例:

- Preview / 非 production: `prisma generate && next build`  
- Production only: `prisma generate && prisma migrate deploy && next build`

| 観点 | 評価 |
| --- | --- |
| Preview → Production mutation | Production と Preview が共有 DB でも **Preview build は schema を触らない**（絶対条件に近づく） |
| Atomicity | migrate 成功 → next build 失敗時、schema は先に進み app は旧のまま、という窓は残る |
| 運用 | スクリプト1箇所の分岐で導入しやすい |
| 位置づけ | **短期安全策の有力候補 A**（実装は別 Phase） |

注意: Production build 内 migrate の失敗モード・互換性は Strategy C ほど制御できない。

### Strategy C｜migrate を build から完全分離（長期本命）

通常 Vercel build から `migrate deploy` を外し、controlled release:

1. migration（明示ステップ）  
2. schema verification  
3. application deploy  

| 観点 | 評価 |
| --- | --- |
| 安全性 | 最高（誰がいつ schema を変えるか明示） |
| 運用負荷 | 中〜高（runbook / 権限 / チェックリスト） |
| schema/app compatibility | expand/contract と組み合わせやすい |
| failed migration | app deploy と分離できる |
| rollback | forward-fix 前提を明文化しやすい |
| 位置づけ | **長期本命候補 A** |

### Strategy D｜Preview 専用 DB

Preview ごと、または共有 Preview non-prod DB（Neon branch 等）。

| 観点 | 評価 |
| --- | --- |
| in-repo 導入状況 | **未証明・記載なし** → 存在仮定禁止 |
| 分離できても | feature branch からの **自動 migrate 可否は別問題**（壊れた migration が Preview を汚染し得る） |
| 位置づけ | Isolation 証明後の **補強候補**。単独では A の危険を消さない |

---

## 4. 推奨構成（本 Phase・コード変更なし）

### 短期（次の実装候補 Phase）

1. **Preview から `prisma migrate deploy` を外す**（Strategy **B** 第一候補）  
2. Dashboard で Preview/Production `DATABASE_URL` fingerprint を記録し isolation を **証明 or 非証明**  
3. Isolation 未証明の間は `prisma/migrations/` へ 4B-4P 候補を **昇格しない**  
4. Preview build health: `prisma generate && next build` を維持（4B-4O.1）

### 長期（production migration 運用）

1. Strategy **C**: migrate を build 外の controlled release へ  
2. Strategy **D** で Preview 専用 DB（任意だが推奨）  
3. expand → verify → wire feature（§6）

---

## 5. Official Prisma migration promotion 条件

4B-4P candidate: `prisma/poc/4b4p_journal_save_operation.sql`  
→ 正式 `prisma/migrations/` へ昇格してよいのは **すべて満たすときのみ**:

| # | 条件 |
| --- | --- |
| 1 | Migration deployment 経路が安全（少なくとも Preview が Production schema を mutation しない） |
| 2 | Preview/Production DB isolation が **Dashboard 証跡で証明**、または Preview migrate 無効化が **実装済み** |
| 3 | Local disposable `127.0.0.1:5433/ljd_dev` で **正式 Prisma migration** 再現 PASS |
| 4 | Existing production schema への **forward migration レビュー**済み（additive） |
| 5 | Data-destructive operation **なし**（DROP TABLE of user data 等禁止） |
| 6 | Rollback / forward-fix 方針が文書化されている |
| 7 | App は migration 適用直後も **save behavior 非変更**（feature flag / 未配線） |

**現時点:** 1・2 未充足 → promotion **B**。

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
