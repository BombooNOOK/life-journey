/**
 * Life Journey Diary｜Lightweight Server→Local Create Reconciliation Spec
 *
 * Status: Pre-Implementation Server-authoritative Create Reconciliation / Insurance Layer Candidate
 * Updated: 2026-08-13
 * Branch: docs/lightweight-create-reconciliation
 * Base: feat/internal-save-operation-e2e-poc @ 4e35eea
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: design only. No reconciliation impl / API / migration / build / main merge.
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4R_LIGHTWEIGHT_CREATE_RECONCILIATION_ARCHITECTURE.md
 * - docs/product/ljd-save-operation-reconciliation-spec.md
 * - docs/hybrid/HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md
 * - docs/product/ljd-local-mirror-outbox-spec.md
 * - docs/product/ljd-local-generation-lifecycle-spec.md
 * - docs/product/ljd-journal-save-idempotency-spec.md
 * - docs/product/ljd-local-save-operation-intent-spec.md
 */

# Life Journey Diary｜Lightweight Create Reconciliation Spec

**Status:** Pre-Implementation Server-authoritative Create Reconciliation / Insurance Layer Candidate  
**ラベル:** **Designed candidate**＝第一候補／**Open**＝未確定／**Forbidden now**＝本Phase実装禁止／**Release Gate**＝未実証

**前提:** Server = Source of Truth。4B-4Q internal で B+C（intent + idempotency + outbox）は Window B/C の通常 save path を閉じ得る。  
**本 SoT:** Strategy **A** — missing **create** のみの保険層。B+C の代替ではない。

---

## 0. 一文

Server には存在するが、active encrypted Local generation に `legacyServerId` が無い entry を検出し、既存 mirror outbox → GET → mirror → ack で Local へ create recovery する。update/delete/conflict/multi-device sync は対象外。

---

## 1. 責務（限定）

| 対象 | 非対象 |
| --- | --- |
| **missing create**（Server id ∉ Local `legacyServerId`） | update propagation |
| | delete propagation |
| | conflict merge |
| | multi-device sync |
| | Local→Server sync |
| | content overwrite when Local already has same `legacyServerId` |

---

## 2. なぜ B+C だけでは足りないか（insurance）

B+C は通常 save path の operational metadata を前提とする。以下では metadata を失い得る：

- iOS backup/restore（intent / outbox は **backup exclude** 候補）
- outbox DB 喪失
- save-intent DB 喪失
- older client（`saveOperationId` 未導入）からの Server create
- internal routing 導入前に作成された Server entry

Server が原本なので、Local completeness を再確認する **保険層**として A を残す。

---

## 3. Current Server list API（コード監査）

**Endpoint:** `GET /api/journal`  
**実装:** `src/app/api/journal/route.ts`

| 項目 | 事実 |
| --- | --- |
| Query | `profileId?`, `month=YYYY-MM` and/or `year=YYYY`, `view`, `q`/`tag`/`searchScope` |
| Month filter | UTC: `createdAt >= UTC(month start)` and `< UTC(next month start)` |
| Year filter | UTC year half-open range |
| Order | `createdAt desc` |
| Pagination | **なし**（cursor / updated-since **不在**） |
| Cap (`take`) | `view=list` → **200**; month non-list → 400; year → 500; 他あり |
| List entry fields（month） | `id`, `content`, `createdAt`, `updatedAt`, mood/activity/companion/designTheme/contentFontMode, `includeInBook`, `generatedComment`, **`hasPhoto`**（本文写真なし） |
| Year path | 上記 + `photoDataUrl` + `diaryNumbers` |
| Single GET | `GET /api/journal/[id]` → richer shape（`photoSrc` / `hasPhoto` 等）— mirror 用 canonical |

**UI day key** は Japan（`Asia/Tokyo`）だが、**list filter は UTC `createdAt`**。月境界でズレ得る → reconciliation month scope は Server filter 仕様に合わせる。

**禁止前提:** 存在しない cursor / updated-since API。

**Open（Release Gate）:** `take=200` で月内件数が cap を超えると取りこぼし。4B-4S / production 前に「cap 超過検知 → fail-closed / manual audit」必須。

---

## 4. Local field 監査

`LocalJournalEntry`（`src/lib/local-first/journal/types.ts`）:

| Field | 用途 |
| --- | --- |
| `legacyServerId` | Server cuid 照合キー（create reconciliation の中心） |
| `serverUpdatedAt` | 将来 conflict 用（create 判定には使わない） |
| `dateKey` | YYYY-MM-DD カレンダー日 — **Server `createdAt` と同一視禁止** |
| `createdAt` / `updatedAt` | Local 行時刻（mapper が Server 時刻をコピーし得るが dedicated serverCreatedAt **なし**） |
| `stableId` / `source` | Local identity / provenance |

**serverCreatedAt 列は存在しない。** scan 開始位置を Local の Server-created watermark から推測しない（R-C 却下理由）。

---

## 5. Scan strategies（比較）

| Id | 方式 | 利点 | 欠点 |
| --- | --- | --- | --- |
| **R-A** | 固定 recent（例: current+previous month） | 単純 | 長期 gap 取りこぼし |
| **R-B** | persisted checkpoint から current まで month 単位 | 前進可能・bounded | checkpoint / cap 設計が必要 |
| **R-C** | Local から開始位置導出 | — | Server createdAt 相当が Local に無い → **推測禁止で却下** |
| **R-D** | explicit/manual full audit | recovery 用 | 日常不可 |

### Designed candidate A

**R-B + current-month always-rescan + R-D manual fallback**

1. `lastFullyReconciledMonth` の **翌月**から、**直前の完了月**まで month-step  
2. **Current month（UTC filter の “now” が属する月）**は常に再 scan（未完成期間）  
3. Cap 超過 / API failure / 手動 recovery → **R-D**  
4. Checkpoint 無し bootstrap は §9（全履歴毎回 scan 禁止）

---

## 6. Checkpoint（独立 metadata）

activation manifest / generation registry / mirror outbox に **混ぜない**。

独立 small store 候補（例）:

| Field | 意味 |
| --- | --- |
| `formatVersion` | schema |
| `lastFullyReconciledMonth` | `YYYY-MM`（UTC list 月）— 完了済み最終月 |
| `lastAttemptAt` / `lastCompletedAt` | 運用 |
| `generationIdAtLastRun` | 実行時 target 記録（opaque） |
| `lastIncompleteReason?` | cap_exceeded / api_failed / generation_failed 等 |

本文・写真・secret・entry payload **保存禁止**。

### Backup policy（候補 A）

**iOS backup include** を第一候補。

- Restore 後に古い checkpoint へ戻る → **余分な再 scan**（取りこぼしより安全）  
- **必須安全条件:** checkpoint が Local generation の実データより「先」だけ復元され、未処理月を飛ばす設計を禁止  
  - 例: restore 時に checkpoint を Local の既知 `legacyServerId` 集合と照合し、不整合なら checkpoint を **reset / conservative rewind**  
  - checkpoint-only 新しく Local 空 → full bootstrap policy（§9）へ

---

## 7. Watermark advancement

Checkpoint / watermark は次の後でのみ advance:

1. 対象 month scope の Server list 取得成功  
2. IDs compared  
3. missing を特定  
4. 各 missing について recovery work が **durable outbox に capture**（enqueue 成功 or unique hit）

**進めない:** API failure、manifest/registry/generation fail-closed、enqueue 失敗中。

### Completeness の語分離

| 語 | 意味 |
| --- | --- |
| **scope_fetched** | month list 取得完了（cap 未超過） |
| **ids_compared** | Server ids vs Local `legacyServerId` |
| **missing_identified** | recovery candidates 列挙 |
| **recovery_captured** | missing が outbox に durable |
| **local_mirror_completed** | outbox → mirror → ack（既存 4B-4I/L） |

`reconciled` を「list を見ただけ」に使わない。  
**Month watermark advance の条件候補 A:** その月が `recovery_captured` まで完了（mirror 完了は outbox に委譲してよい）。  
Open: pending outbox が残っていても月を完了扱いにするか — **候補 A = 残ってよい**（durable capture 済みなら watermark advance 可）。mirror 失敗は outbox pending として既存 retry。

---

## 8. Month semantics

- Reconciliation month key = Server list の **UTC `YYYY-MM`**（`parseMonth` と同一）  
- Current month = 「今」が属する UTC month → **毎回 rescan**、`lastFullyReconciledMonth` に **含めない**（未完成）  
- 過去月: cap 内で全件比較 + recovery_captured 後に advance  
- Japan `dateKey` は missing 判定キーに使わない

---

## 9. Bootstrap（checkpoint 無し）

| Policy | 評価 |
| --- | --- |
| migration 完了時に checkpoint seed | 将来 formal migration 後の候補 |
| recent bounded scan（例: current+N months）+ R-D | bootstrap 第一候補 |
| checkpoint なし＝全履歴毎回 scan | **不可** |
| 4B-4B 3件 PoC を production migration 完了とみなす | **禁止** |

Open: production rollout 前に N と seed 契機を確定。

---

## 10. Missing → recovery

```
Server list entry.id
  ∉ Local.getByLegacyServerId
→ recovery candidate
→ resolve healthy technical_active (manifest + registry + preflight)
→ enqueueBeforeMirror (existing outbox)
→ canonical GET /api/journal/[id]
→ mirror primitive
→ ack
```

**新 reconciliation mirror engine 禁止。**

### Generation target（重要）

| 状況 | Target |
| --- | --- |
| 既存 outbox pending | **pinned** generation — silent retarget **禁止** |
| Reconciliation で新規発見した missing create | 実行時の **healthy technical_active** |

これは「失われた operational metadata の再発見」であり、既存 pending の retarget ではない。docs 上も分離。

### source_changed / Local already has id

Local に同一 `legacyServerId` がある → create reconciliation は **何もしない**（GET→overwrite 禁止）。

### Server missing / Local existing

自動 delete **禁止**（delete reconciliation 対象外）。

---

## 11. Old clients / multi-device / timing

- **Old clients:** `saveOperationId` 無しでも Server create は list で発見可能 → A を残す理由の一つ  
- **Multi-device:** primary device 方針維持。別端末由来 entry を「missing create」として mirror できる可能性はあるが、正式 multi-device policy とは分離  
- **実行:** explicit foreground / Journal open 後の bounded check / restore flow。**background 禁止。**毎画面全 scan 禁止

---

## 12. Release role

| Layer | Role |
| --- | --- |
| **B+C** | 通常 save path の Window B/C gap closure |
| **Lightweight A** | metadata 喪失・restore・old client の insurance |

A を B+C の代替にしない。  
A 単独で production `SERVER_SUCCESS_TO_OUTBOX_GAP` を closed 扱いにしない。

Production blocker close には少なくとも: official migration、production POST wiring、durable intent、idempotent lookup（+ 本 A の実証）が残る。

---

## 13. Next PoC

**4B-4S｜Internal Lightweight Create Reconciliation PoC**  
local disposable Server DB + explicit fixture のみ。一般あしあと / Neon 禁止。

---

## 14. Forbidden now

reconciliation 実装、Server API 変更、cursor endpoint、update/delete sync、background sync、official Prisma migration、Vercel env、Production deploy、main merge。
