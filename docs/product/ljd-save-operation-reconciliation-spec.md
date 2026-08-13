/**
 * Life Journey Diary｜Save Operation Recovery / Gap Closure Candidate
 *
 * Status: Pre-Implementation Save Operation Recovery / Gap Closure Candidate
 * Updated: 2026-08-13
 * Branch: docs/server-success-outbox-gap-closure
 * Base: feat/internal-journal-save-mirror-wiring-poc @ 2016454
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: design only. No API/DB/impl/build/Simulator/main merge.
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md
 * - docs/product/ljd-transitional-local-routing-spec.md
 * - docs/hybrid/HYBRID_PHASE_4B4L_INTERNAL_SAVE_WIRING_POC.md
 * - docs/product/ljd-local-mirror-outbox-spec.md
 */

# Life Journey Diary｜Save Operation Reconciliation / Gap Closure Spec

**Status:** Pre-Implementation Save Operation Recovery / Gap Closure Candidate  
**ラベル:** **Designed candidate**＝第一候補／**Open**＝未確定／**Forbidden now**＝本Phase実装禁止／**Release Gate**＝未実証

**前提（4B-4L 正式 PASS）:** internal save mirror wiring / enqueue→mirror→ack / Local failure→retry。  
**未解決 Release Blocker 候補:** `SERVER_SUCCESS_TO_OUTBOX_GAP`。  
**RG-1〜4:** 未完。一般 production rollout / main merge: **不可**。

---

## 0. 問題の一文

Server が journal entry と donguri settlement を確定した後でも、client が durable Local mirror queue（outbox）へ到達する前に crash / response loss すると、**Server-only committed entry** が残り、Local も outbox も持たない可能性がある。

4B-4I/L は **outbox enqueue 後**の crash を回復する。本 SoT は **enqueue 前（および response lost）** を閉じる設計候補である。

---

## 1. Crash windows（A〜D）

| Window | 区間 | Server entry | Donguri | Outbox | Local mirror | 現状 |
| --- | --- | --- | --- | --- | --- | --- |
| **A** | Local intent なし → POST 送信前 crash | なし | なし | なし | なし | 問題なし（保存未開始） |
| **B** | POST processing / network interruption（結果不明） | **あり得る** | **あり得る** | なし | なし | client unknown；**Window C と分離必須** |
| **C** | Server 200 OK + `entry.id` 確定 → outbox enqueue 前 crash | あり | あり（成功パス） | なし | なし | **`SERVER_SUCCESS_TO_OUTBOX_GAP`** |
| **D** | outbox enqueue 後 crash | あり | あり | pending | 未完了可 | **4B-4I/L で回復可能** |

### Window B vs C（分離）

- **B:** client は成功を知らない。Server は create+charge 済みの可能性がある。**再 POST は二重 create / 二重 charge リスク**（現状 API に operation idempotency なし）。
- **C:** client は少なくとも一瞬は成功を知り得るが、durable enqueue 前に死ぬ。**再 POST は不要**だが、**entryId → outbox 再投入**が必要。

両 Window を「同じ gap」に畳むと、誤って create 再実行や全履歴 scan に寄りやすい。**B は idempotent result recovery、C は confirmed-id → queue recovery** として分ける。

---

## 2. Current Server API / DB audit（コード監査のみ）

監査対象: `src/app/api/journal/route.ts`、`prisma/schema.prisma`、`src/lib/loghouse/donguriLedger.ts`。  
**存在しない endpoint / フィールドを前提にしない。**

### 2.1 `POST /api/journal`

概念順（実装どおり）:

1. auth / entitlement  
2. validate body（`content`, mood/activity/companion/theme, `entryDate`, photo patch, profile）  
3. **pre-check** `sumDonguriBalance` → 不足なら **402**（create 前）  
4. `prisma.journalEntry.create`  
5. photo update / draft photo transfer  
6. `chargeDiarySaveAcorns({ journalEntryId })`  
7. charge insufficient → **`journalEntry.delete`** → 402  
8. draft delete  
9. **200** `{ entry, donguriBalance, code: "OK", … }`

**なし:** `clientOperationId` / `operationId` / `requestId` / `Idempotency-Key`。  
同一 POST の再送は **新しい cuid entry** を作り得る。

### 2.2 `JournalEntry` schema

- `@id` cuid + `createdAt` / `updatedAt` + content/meta/photo fields  
- `@@index([email, profileId])` のみ  
- **unique なし**（operation 列なし）

### 2.3 Donguri coupling

- `chargeDiarySaveAcorns`；ledger `dateKey = entry:{journalEntryId}`、`idempotencyKey` / `@@unique` あり  
- **同一 journalEntryId への再 charge は ledger 側で `alreadyCharged` になり得る**  
- しかし **別 journalEntryId の再 create** は **別 charge**（二重課金）  
- create→charge は **単一 DB transaction ではない**（charge 失敗時は delete で補償）

### 2.4 List / GET

| Endpoint | 実在クエリ | 備考 |
| --- | --- | --- |
| `GET /api/journal` | `profileId`, `year`, `month`, `view=list`, `q`, `tag`, `searchScope` | **`createdAt` 月/年レンジ**で絞り込み。`orderBy createdAt desc`。hardcoded `take` |
| `GET /api/journal/[id]` | path `id` | canonical 1 件 |
| — | **なし** | `updated-since` / `updatedSince` / cursor / explicit createdAt from-to クエリ |

→ 「全履歴毎回 scan」も「updated-since cursor API」も **現状第一前提にできない**。lightweight reconciliation は **既存 month/year list + single GET**、または **将来の最小 API 追加（別 Phase）** と切り分ける。

### 2.5 Local wiring（4B-4L）

- client 確定地点: `res.ok && entry.id`  
- その後: `handleConfirmedServerJournalMirror` → resolve → **enqueue → mirror → ack**  
- gap fixture: `simulateCrashBeforeEnqueue` → `SERVER_SUCCESS_TO_OUTBOX_GAP`  
- **save-intent / reconciliation 実装は未存在**

---

## 3. Strategy 比較

### Strategy A｜Post-save reconciliation

Server journal と Local `legacyServerId` を照合し、Server-only を outbox へ回す。

| 観点 | 評価 |
| --- | --- |
| Window C | **回収可**（entryId が Server にあれば） |
| Window B | **部分的**（どの entry が「今の操作」か不明；recent list で候補化は可能だが誤検出・過剰 mirror リスク） |
| API 負荷 | 全履歴 scan は **第一候補にしない**。現状は month/year list のみ |
| photo / 大量履歴 | GET by id + mirror は既存；list の take 上限あり |
| deleted/updated | Local 自動 delete / overwrite **禁止**（`source_changed` 維持） |
| multi-device | primary device 方針；sync engine 化禁止 |
| privacy | list/content を広く読むほど露出増 |
| offline | Server-authoritative 期間は final save online のみ |

**判定:** 単独では Window B（response lost + duplicate POST）を閉じきれない。**保険としての lightweight A** は有力。

### Strategy B｜Durable pre-save Local intent

POST 前に端末へ `saveOperationId` を durable enqueue。

```
generate saveOperationId
→ durable local save-intent
→ Server POST
→ bind Server result (entryId)
→ Local mirror outbox / mirror
→ ack intent
```

| 観点 | 評価 |
| --- | --- |
| Window A | intent のみ残る → abandoned intent 処理が必要 |
| Window B | intent は残るが、**Server が operationId を知らないと entryId を安全復元不可** |
| Window C | intent あり +（理想）entryId bind 前に死ぬ場合、やはり Server 照会が必要 |
| donguri | intent だけでは二重 POST を止められない |

**明記（必須）:** Server が `saveOperationId` を理解しない限り、**response lost 時に「同じ操作の canonical entryId」を安全に復元できない**。B alone は不十分。

### Strategy C｜Server idempotency / client operation ID

client 生成 opaque `saveOperationId`（例 ULID）を create に渡し、Server が同一 operation を idempotent に扱う。

理想:

- 初回のみ 1 entry + 1 donguri settlement  
- duplicate POST → 同一 canonical result  
- response lost 後も operationId → result 照会可能  

| 現状からの変更（監査） | 必要度 |
| --- | --- |
| POST body に operationId | 必須（未存在） |
| JournalEntry または operation ledger の unique(operationId) | 必須 |
| create+photo+donguri を **同一 operation の結果**として記録 | **必須**（entry だけ idempotent・donguri 二重は不可） |
| operation 結果照会 API | Window B 閉じるならほぼ必須 |
| DB migration | 必須（本 Phase では実装禁止） |

### Strategy D｜Server-side mirror receipt / ledger

「Local mirror 未確認」を Server operational record に持つ。

| 観点 | 評価 |
| --- | --- |
| Server DB 変更 | 大 |
| multi-device / cleanup / 肥大化 | 重い |
| Local generation ID を Server へ | **避ける**（device-local identity） |
| privacy | Server に運用メタが増える |

**判定:** 初期の gap closure 第一候補にはしない。必要なら後続で「operation completed / mirror-ack は device-local」を維持した薄い receipt を再検討。

---

## 4. Hybrid 比較

| 案 | 概要 | Window B | Window C | 実装負荷 | 備考 |
| --- | --- | --- | --- | --- | --- |
| **A only** | post-save reconcile | 弱い | 強い | 中（API 制約あり） | duplicate POST 未解決 |
| **B only** | pre-save intent | 弱い（entry 復元不可） | 中 | 中 | Server 非対応だと限界 |
| **B + C** | intent + Server idempotency | **強い** | **強い** | 高（API/DB） | 本命の構造 |
| **B + C + lightweight A** | 通常 B+C、A は保険 | **最強候補** | **最強候補** | 高 | A は全履歴 scan にしない |

**結論を先に固定しないが、比較上の有力候補:** **B + C + lightweight A**。

- 通常経路: durable intent → idempotent Server save → bind entryId → existing mirror outbox  
- 保険: lightweight reconciliation（recent month/year list ∩ missing legacyServerId）  
- Strategy D は初期除外

---

## 5. `saveOperationId` 方針

- **別概念:** Journal `stableId` / Server cuid / Local generationId と混同しない  
- **意味:** 一回の「あしあとを森に残す」保存操作の idempotency identity  
- **性質:** opaque、client generated（ULID 等）、user-facing でない、本文・写真・secret を含まない  
- **寿命:** intent → Server bind → mirror ack まで；abandoned は TTL / manual cleanup 候補

---

## 6. Donguri atomicity（最重要）

現状: create → photo → charge →（失敗時 delete）→ 200。

idempotency 導入時の必須条件:

1. **operation の成功結果には「entryId + donguri settlement 結果」がセットで含まれる**  
2. **entry だけ idempotent・donguri が二重 charge** は **不可**  
3. pre-check 402（create 前）と post-create delete 402 の両方を、operation 状態機械で表現する  
4. ledger の `entry:{journalEntryId}` dedup は **entryId 確定後**の防御；**operation 単位の一意性**が先に必要

推奨概念状態（設計）:

`intent_recorded` → `server_in_flight` → `server_completed{entryId, charge}` | `server_failed` → `mirror_queued` → `mirror_acked`

---

## 7. Response lost recovery

Server では保存・charge 成功したが client が 200 を受け取れないケースは、**Window C より広い Window B 問題**。

safe retry には、少なくとも operationId から次が取れる必要がある（**Designed candidate**）:

| フィールド | 用途 |
| --- | --- |
| `status` | `completed` / `failed` / `unknown_or_in_progress` |
| `canonicalEntryId` | completed 時 |
| `donguriSettlement` | charged / alreadyCharged / failed（非 PII） |
| `errorCode` | failed 時 |

「もう一度同じ POST」は **C（idempotent）が無い限り禁止寄り**。

---

## 8. Lightweight reconciliation scope

**全履歴毎回 scan は第一候補にしない。**

| 候補 | 現状 API | 評価 |
| --- | --- | --- |
| last successful mirror watermark（device-local） | — | 有力。corruption 時は month fallback |
| Server `createdAt` month/year list | **既存** | 第一の保険範囲 |
| `updated-since` / cursor | **未存在** | 将来オプション（想像で前提にしない） |
| recent N days | month list で近似 | 可 |
| explicit operation receipts | 要 C | B+C と相性良 |

**結果アクション（Server-only 検出時）:**

active healthy generation resolve → outbox enqueue → canonical GET → mirror  

- historical bulk import と **new-save gap recovery** はラベルで区別（同一 overwrite パイプラインにしない）  
- 一般あしあとを勝手に delete/update しない  
- `source_changed` → 自動 overwrite しない  
- Server 欠落 Local → 自動 delete しない  

---

## 9. Outbox との責務分離

| 層 | 責務 | キー |
| --- | --- | --- |
| **Save-operation journal**（新・候補） | intent / Server result recovery / abandoned | `saveOperationId` |
| **Mirror outbox**（既存 4B-4I） | entryId 確定後の Local mirror queue | `(serverEntryId, targetGenerationId)` |

**第一候補:** schema を雑に混ぜない（separate save-operation journal）。  
既存 outbox を拡張して pre-save intent を同居させる案は、責務混線のため劣後。

---

## 10. Generation routing / fail-closed

reconciliation / recovery mirror も:

- manifest valid  
- registry row / pair / `technical_active` / integrity  
- encrypted candidate preflight  

を維持。corrupt / missing / quarantined を無視して別 DB へ書かない。plaintext actual DB fallback 禁止。

---

## 11. Multi-device / offline / backup / security

| 項目 | 方針 |
| --- | --- |
| Multi-device | 「いつもの森」primary のみ。自動 multi-device sync engine へ膨張させない |
| Offline | final save は online。offline **draft** と pre-save **intent** は同一概念にしない |
| Backup | operation journal は **iOS backup exclude 候補**（transient）。restore 時 unknown Server operation との tradeoff あり。Moving Package **非含有**候補 |
| Security | operation journal / reconcile metadata に **本文・写真・secret を保存しない**。最小: operationId, serverEntryId?, status, timestamps |

---

## 12. 実行タイミング（初期）

第一候補: **app foreground** および／または **manual recovery**。  
Journal open / login 後はオプション。**background sync へ広げない。**

---

## 13. Release blocker closure criteria

`SERVER_SUCCESS_TO_OUTBOX_GAP` を「閉じた」と言える **最低条件**（すべて必要）:

1. **Response lost** でも duplicate create / duplicate donguri charge を起こさず結果回収可能（概ね **C**）  
2. **Server-only committed entry** を検出可能（**C bind 失敗時の lightweight A** または operation receipt）  
3. 検出後、**durable Local mirror queue（既存 outbox）へ再投入可能**  
4. kill/relaunch で intent / pending 状態が維持  
5. **no silent data loss**（勝手な delete/overwrite なし）  
6. generation routing fail-closed 維持  

「reconciliation を実装した」だけでは close 扱いにしない。

---

## 14. 禁止（本 Phase = 4B-4M 設計）

Journal API 変更、DB migration、idempotency / reconciliation / pre-save intent 実装、production deploy、build、Simulator、main merge。

---

## 15. A/B（設計時点の判断用）

| 問い | 候補 |
| --- | --- |
| B+C+lightweight A を第一候補にできるか | **A（有力）** — ただし未実装・未実証 |
| 次に save-operation idempotency PoC | **A（推奨）** — Window B の核 |
| reconciliation PoC を先にすべきか | **B（条件付き）** — 既存 month list だけの薄い保険 PoCは可だが、blocker close には C が必要 |
| 一般 production rollout | **B** |
| main 統合 | **B** |

---

## 16. Cross-links

- `docs/hybrid/HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md`
- `docs/hybrid/HYBRID_PHASE_4B4N_SERVER_SAVE_IDEMPOTENCY_POC.md` (Strategy C core PoC)
- `docs/hybrid/HYBRID_PHASE_4B4O_LOCAL_SAVE_OPERATION_INTENT_POC.md` (Strategy B Local intent PoC)
- `docs/hybrid/HYBRID_PHASE_4B4P_NONPROD_PRISMA_IDEMPOTENCY_INTEGRATION.md` (nonprod Prisma)
- `docs/hybrid/HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md` (B+C internal E2E)
- `docs/product/ljd-journal-save-idempotency-spec.md`
- `docs/product/ljd-local-save-operation-intent-spec.md`
- `docs/product/ljd-transitional-local-routing-spec.md`
- `docs/hybrid/HYBRID_PHASE_4B4L_INTERNAL_SAVE_WIRING_POC.md`
- `docs/product/ljd-local-mirror-outbox-spec.md`
- `docs/hybrid/HYBRID_PHASE_4B4I_LOCAL_MIRROR_OUTBOX_POC.md`
- `docs/product/ljd-local-generation-lifecycle-spec.md`
