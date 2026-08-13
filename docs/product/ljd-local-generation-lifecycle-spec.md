/**
 * Life Journey Diary｜Local Journal Generation Lifecycle
 *
 * Status: Pre-Implementation Local Generation Lifecycle / Source of Truth Candidate
 * Updated: 2026-08-12
 * Branch: docs/local-journal-generation-lifecycle
 * Base: feat/local-mirror-outbox-poc @ 46e5a44
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: design only. No registry impl, rename, delete, production wiring,
 *        build, Simulator, or main merge.
 *
 * 親方針:
 * - docs/product/ljd-product-worldview-source-of-truth.md
 * - docs/product/ljd-local-first-and-moving-policy.md
 * - docs/product/ljd-local-journal-activation-spec.md
 * - docs/product/ljd-local-journal-write-routing-spec.md
 * - docs/product/ljd-transitional-local-routing-spec.md
 * - docs/product/ljd-local-mirror-outbox-spec.md
 * - docs/product/ljd-moving-package-spec.md
 * - docs/product/ljd-device-storage-and-restore-spec.md
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4J_GENERATION_LIFECYCLE_ARCHITECTURE.md
 * - docs/product/ljd-lightweight-create-reconciliation-spec.md
 * - docs/hybrid/HYBRID_PHASE_4B4R_LIGHTWEIGHT_CREATE_RECONCILIATION_ARCHITECTURE.md
 */

# Life Journey Diary｜Local Journal Generation Lifecycle

**Status:** Pre-Implementation Local Generation Lifecycle / Source of Truth Candidate  
**ラベル:** **Designed candidate**＝第一候補／**Open**＝未確定／**Forbidden now**＝本Phase実装禁止／**Release Gate**＝未実証

**前提（4B-4A〜4I）:** Server = Source of Truth。encrypted Local = mirror。activation manifest = Application Support pointer。generation resolver / write-through mirror / independent SQLCipher outbox PASS。enqueue → mirror → ack。pending は target generation へ pin。silent retarget 禁止。outbox は iOS backup exclude。一般 UI / production save 未接続。RG-1〜4 未完。

**本Phase:** generation lifecycle **設計のみ**。削除・rename・registry 実装・production 配線なし。

---

## 0. 目的

generation は **DB ファイル名ではない**。

> **generation = (databaseId + mediaRootId) を束ねた論理単位**  
> （+ schemaVersion / opaque generationId / lifecycleState）

検討対象（設計）:

| 対象 | 今回 |
| --- | --- |
| 作成 / preflight | 設計 |
| technical activation | 設計（実装済み pointer と整合） |
| previous 化 / rollback 保持 | 設計 |
| pending 保持との関係 | **最重要** |
| retire 可否 / quarantine | 設計 |
| 将来の安全な削除 | 方針のみ・**実行禁止** |

`schemaVersion`（PRAGMA / journal schema）と lifecycle state / generation identity を **混同しない**。

---

## 1. Lifecycle states（第一候補）

ユーザー提示の候補を整理・統合した第一セット:

| State | 意味 |
| --- | --- |
| **staged** | 作成開始〜preflight 前。routing 対象外 |
| **ready** | preflight PASS。まだ technical active ではない |
| **technical_active** | activation manifest が指す現在の technical active（原則1つ） |
| **previous** | 直前 active。端末内 rollback 保険。通常の新規 enqueue 対象外 |
| **retirement_blocked** | retire 条件未達（特に outstanding outbox / attention）。保持必須 |
| **retired** | 通常 routing 対象外。rollback 保証も終了。**即削除ではない** |
| **quarantined** | 整合性失敗。routing 禁止。自動 repair/削除/fallback 禁止 |

**採らない（今回）:**

| 案 | 理由 |
| --- | --- |
| `deleted` を正式 state | 物理削除は別 policy。tombstone が必要なら将来 Open |
| lifecycle に schemaVersion を埋め込む | identity / schema / lifecycle は別軸 |

`retirement_blocked` は previous（または retired 手前）に付随する **制約フラグ相当**としても表現できるが、第一候補では **明示 state**（または previous + blockReason）として扱う。実装時に「state vs flag」は Open。

---

## 2. Active は原則1つ

| 原則 | 第一候補 |
| --- | --- |
| technical active 数 | **1** |
| 唯一の active pointer | **activation manifest** |
| lifecycle registry が別 active pointer を持つ | **しない**（二重管理禁止） |

registry は各 generation の **lifecycleState を記録**する。  
「今どれを使うか」の runtime 解決は **manifest → resolve/preflight**。  
registry の `technical_active` は manifest と **整合検証用の鏡**であり、第二の pointer にしない。

---

## 3. Previous generation

generation A が active のとき B を activate:

```text
B = technical_active（manifest が指す）
A = previous（rollback candidate）
```

- A を **即 retire / 削除しない**
- **rollback window** を設ける（期間・検証条件は Open / Release Gate）
- window 中は A を previous として保持

---

## 4. Outbox pin との関係（最重要）

generation A 宛ての outbox item が次のいずれかで残っている場合、**A を retire 可能にしない**:

- `pending`（未 attempt / lastResult null）
- `retry_needed`
- `attention_required`（source_changed 等）

| 条件 | 扱い |
| --- | --- |
| `outstandingOutboxCount(A) > 0` | **retirement_blocked**（第一候補） |
| silent drop | **禁止** |
| B への silent retarget | **禁止**（4B-4I 継続） |

outstanding の定義（第一候補）:

> A を `targetGenerationId` に持つ、未 ack の outbox 行。  
> `source_missing` / `generation_changed` / `target_unavailable` も **未解決なら count に含める**（人手 / lifecycle 明示処理まで）。

---

## 5. Generation 切替後の新規保存（正当な transition）

将来 production routing 有効時:

| タイミング | enqueue 先 |
| --- | --- |
| activation **後**の新しい Server 保存 | **新 active B** |
| activation **前**に作られた pending | **作成時 A に固定** |

一時的併存は **正当**:

```text
old pending → A（pin）
new save   → B（active）
```

routing / diagnostics は両 generation の outbox を区別して扱う。混ぜない。

---

## 6. Retirement 条件（候補・今回は実行しない）

generation G を **retire 可能**とする条件候補（すべて満たすこと）:

1. G は **technical_active ではない**
2. activation manifest の **previous として rollback 必須期間を終えた**（または previous から外れた）
3. `outstandingOutboxCount(G) = 0`
4. `attention_required` 相当の未解決 = 0（上と重複し得る）
5. DB integrity PASS
6. media integrity PASS
7. successor generation verification PASS（現行 active が健全）
8. required rollback / reopen verification PASS（window 方針に従う）
9. Source-of-Truth policy 上、削除・retire が許可される（Server-authoritative 期間は「人生記録原本喪失」を招かないこと）

**本Phase:** retire / delete **しない**。条件の文書化のみ。

---

## 7. Previous と Retired の分離（第一候補）

| State | 役割 |
| --- | --- |
| **previous** | rollback 可能な保険 generation。端末内に保持 |
| **retired** | 通常 routing 対象外。rollback 保証も終了 |

- retired ≠ 即削除  
- retired 後も物理削除は **§16 deletion policy** まで待つ  
- previous → (optional retirement_blocked) → retired

---

## 8. Quarantine

次を検出したら **quarantined**（routing 禁止）:

- checksum 異常（manifest / registry / DB）
- schema 不整合
- media 不整合（pair / missing）
- encryption 確認失敗
- missing files

**禁止:** 自動 repair / 自動削除 / 自動 fallback（例: silent に A へ戻る）。  
developer-visible error + fail-closed。

---

## 9. Lifecycle metadata 保存方式

| 案 | 評価 |
| --- | --- |
| A activation manifest へ全部追加 | pointer 肥大・責務混在 | 非推奨 |
| **B 独立 generation registry** | 複数 generation の state を横断管理 | **第一候補** |
| C outbox DB へ混在 | queue と lifecycle 混在 | **禁止寄り** |
| D 各 journal DB 内 metadata table | generation 横断・壊れた DB で読めない | 補助のみ可 |

**第一候補:**  
activation manifest は **active / previous pointer を小さく保つ**。  
複数 generation の lifecycle は **独立 registry**。  
**outbox に混ぜない**。

---

## 10. Generation registry（最小候補）

| 列 | 内容 |
| --- | --- |
| generationId | opaque（ULID 等） |
| databaseId | 技術 id（現状は既存名も許容） |
| mediaRootId | media 論理 root |
| schemaVersion | journal schema（lifecycle と別軸） |
| lifecycleState | §1 |
| createdAt | |
| activatedAt | nullable |
| previousAt | nullable |
| retiredAt | nullable |
| integrityStatus | ok / unknown / failed … |

**禁止:** secret / 本文 / 写真 / email / cookie。

### outstandingOutboxCount

| 案 | 評価 |
| --- | --- |
| registry に永続保存 | 不整合・二重の真実になりやすい |
| **outbox から毎回算出（derived）** | **第一候補** |

registry に cache するなら **hint のみ**で、retire 判定の権威は outbox query。

---

## 11. Generation ID

| 方針 | 第一候補 |
| --- | --- |
| user-facing `g1/g2` | **露出しない** |
| opaque ID | **ULID 等** |
| DB filename / media root を ID から導出 | 将来候補（Open）。衝突・移行を要設計 |
| 既存 candidate rename | **今回禁止** |

現行 PoC の outbox `targetGenerationId = databaseId` は registry 導入までの **暫定 opaque 相当**。正式 ULID へはマッピング表で移行。

---

## 12. 現行 candidate との互換

現状:

- DB: `ljd_local_journal_secure_candidate`
- media: `ljd/media/journal-secure-candidate/`

**壊さない。rename / copy 禁止（本Phase）。**

移行案（設計）:

1. registry に既存 pair を **1 row** として登録（generationId 新規 ULID、databaseId/mediaRootId は現状のまま）
2. manifest の activeDatabaseId / activeMediaRootId は現状値を継続
3. outbox pin は当面 databaseId キー、registry 導入後は generationId へ段階移行（Open）
4. 将来の新 generation のみ ULID 導出命名を検討

---

## 13. 責務分離

| 層 | 責務 |
| --- | --- |
| **activation manifest** | 今どれを **technical active**（と previous）として使うか |
| **generation registry** | 各 generation がどの **lifecycle state / integrity** か |
| **outbox** | どの Server entry をどの generation へ mirror する必要があるか |

三者を混在させない。

---

## 14. Manifest / registry 不整合 → fail-closed

例: manifest は B を active と指すが、registry では B が quarantined。

| 対応 | 第一候補 |
| --- | --- |
| resolve / routing | **fail-closed** |
| silent fallback to A | **禁止** |
| ユーザー一般 UI | 現状どおり Server（SoT）。Local mirror 経路は停止 |
| developer | 不整合を **visible error** として報告 |

---

## 15. Activation 中 crash（順序設計・実装なし）

A active → B activation 中に kill。

**優先:** 常に **1つの generation が安全に active として resolve できる**こと。  
manifest の atomicity（4B-4F）を維持しつつ、registry 更新順序を設計。

### 第一候補順序

```text
1. B ready 確認（preflight / integrity）
2. registry: B を transition preparation（例: ready → activating 相当 / Open）
3. manifest atomic switch（active=B, previous=A）
4. readback + preflight
5. registry 確定: B=technical_active, A=previous
```

| 途中 crash | 期待 |
| --- | --- |
| step 3 前 | manifest は A のまま → A resolve |
| step 3 成功・step 5 前 | manifest=B → B を resolve。registry 未確定は **readback で修復 or fail-closed**（silent A 禁止） |
| transaction marker | 比較候補（Open）。必須とはしない |

実装・PoC は本Phase禁止。

---

## 16. Rollback と pending

B activation 後に verification failure:

| 状況 | 扱い |
| --- | --- |
| B へ新規 outbox がまだない | B を previous/quarantine 候補にし、manifest を A へ戻す設計は可（検証後） |
| B 宛て pending が既にある | **B pending を A へ retarget しない**。B を保持。pending 解決まで **retirement_blocked** |

rollback は pointer の話。outbox pin は **generation 固定**のまま。

---

## 17. Server Source of Truth 期間

- Local generation が壊れても **人生記録原本を失う設計にしない**（Server が原本）
- しかし「Server から再構築できるから **自動削除してよい**」とはしない
- **destructive recovery 禁止**

### Future Local-authoritative lifecycle

Local が原本になった後は retirement / deletion 条件が **より厳しく**なる。  
**現在の Server-authoritative lifecycle と混同しない。** 本SoTは前者のみ。

---

## 18. Backup / restore

| 対象 | 方針（既存と整合） |
| --- | --- |
| Local generation DB/media | backup 対象候補（life-record） |
| outbox | **backup excluded**（4B-4I） |

device restore 後に起こり得る状態:

```text
restored active generation
restored registry（または欠落）
outbox なし
```

→ 将来 **Server との reconciliation / mirror completeness verification** が必要。  
**Release Gate** として残す（RG-2 backup content / RG-3 restore と接続）。  
本Phaseで RG-1〜4 の定義は変更しない。

---

## 19. Moving Package（初期候補・実装変更なし）

| 含める | 含めない |
| --- | --- |
| **active generation** のみ正式 package 対象 | previous（端末内 rollback 用） |
| | retired / quarantined |
| | outbox |

整合確認のみ。moving package 実装変更はしない。

---

## 20. Production save 配線の precondition（Gate）

developer / internal-only save 配線へ進む前の最低限候補:

1. target generation が **technical_active**（または明示許可された ready→active 経路）であること  
2. lifecycle registry と manifest が **整合**（不整合なら fail-closed）  
3. target が **retired / quarantined でない**  
4. enqueue 後は **generation pin を維持**（silent retarget なし）

registry 未実装期間: manifest + resolver + 既存 allowlist で代用し得るが、**本 lifecycle 設計を満たす薄い registry PoC を先に置くかが次の A/B**。

---

## 21. Deletion policy（将来・今回対象外）

物理削除の最低条件候補:

- `retired`
- rollback window 終了
- outbox zero（outstanding = 0）
- explicit safe cleanup（人手 / developer 明示）
- SoT policy 上許可

**auto cleanup は禁止候補。**

---

## 22. 禁止（本Phase）

generation registry 実装、candidate rename、generation delete、production save 配線、pointer-driven production routing、outbox production routing、build、Simulator、main merge。

---

## 23. 矛盾時の優先

世界観 → Local-first / お引越し便 → activation SoT → write-routing / transitional routing → outbox SoT → **本 lifecycle SoT（候補）** → Hybrid メモ → コード。

---

## 24. 4B-4K Generation Registry PoC（追記）

| 項目 | 結果 |
| --- | --- |
| Registry DB | `ljd_local_generation_registry_poc`（plain SQLite + Complete） |
| Backup | **included**（life-record / manifest と同復元） |
| manifest `generation` | number ordinal — **registry generationId に再利用しない** |
| compatibility | `legacyGenerationAlias: manifest-generation:2` |
| Initialize | developer explicit / idempotent / 1 candidate row |
| Resolver | `resolveLocalJournalGenerationTargetWithRegistryValidation` |
| Routing | **technical_active のみ** |
| outstanding | outbox derived |
| 証拠 | `docs/hybrid/HYBRID_PHASE_4B4K_GENERATION_REGISTRY_POC.md` |

registry 未実装期間の注記（§20）は **PoC 完了**により解消。save 配線は未接続。
