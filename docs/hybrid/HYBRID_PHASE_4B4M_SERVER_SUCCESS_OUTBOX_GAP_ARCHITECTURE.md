/**
 * Phase 4B-4M — SERVER_SUCCESS_TO_OUTBOX_GAP Closure Architecture Review
 * Branch: docs/server-success-outbox-gap-closure
 * Base: feat/internal-journal-save-mirror-wiring-poc @ 2016454
 */

# Hybrid Phase 4B-4M｜SERVER_SUCCESS_TO_OUTBOX_GAP Architecture

**Status:** Pre-Implementation Save Operation Recovery / Gap Closure Candidate  
**本Phase:** **docs only**（API/DB/impl/build/Simulator/main merge 禁止）

## 目的

4B-4L 正式 PASS 後も残る Release Blocker 候補  
**`SERVER_SUCCESS_TO_OUTBOX_GAP`**  
（およびより広い **response lost / Window B**）を閉じるための **設計比較**。

親 SoT: `docs/product/ljd-save-operation-reconciliation-spec.md`

---

## 1. 現状（4B-4L まで）

| 項目 | 状態 |
| --- | --- |
| Server = SoT | 維持 |
| production save transaction | 従来どおり（変更なし） |
| internal mirror wiring | **正式 PASS** |
| enqueue → mirror → ack | **PASS** |
| Local failure → reopen/retry | **PASS** |
| general read | Server |
| RG-1〜4 | 未完 |
| `SERVER_SUCCESS_TO_OUTBOX_GAP` | **未解決** |

確定地点（client）: `res.ok && entry.id` → `handleConfirmedServerJournalMirror`。

---

## 2. Windows A〜D（要約）

| W | 内容 | 回復の鍵 |
| --- | --- | --- |
| A | POST 前 | 不要（未保存） |
| B | POST 中 / response lost | **operation idempotency + result lookup**（現状 API に無し） |
| C | 200 後〜enqueue 前 | confirmed `entryId` → outbox 再投入 / lightweight reconcile |
| D | enqueue 後 | **既存 outbox**（4B-4I/L） |

**B と C は分離。** C だけを reconciliation で塞いでも、B の二重 create/charge は残る。

---

## 3. 現 API/DB 監査（要点）

- `POST /api/journal`: create → photo → `chargeDiarySaveAcorns` →（不足時 delete）→ 200。**operationId なし**。  
- `JournalEntry`: cuid PK、operation unique **なし**。  
- Donguri ledger: `entry:{journalEntryId}` 単位の dedup あり → **別 entry の再 create では二重 charge し得る**。  
- `GET /api/journal`: **month/year `createdAt` レンジ** + search。**`updated-since` / cursor は未存在**。  
- `GET /api/journal/[id]`: canonical 1 件。  

詳細表は product SoT §2。

---

## 4. Strategy A〜D

| Strategy | 一言 | 初期向き |
| --- | --- | --- |
| **A** Post-save reconciliation | Server-only ↔ missing `legacyServerId` | 保険のみ（全履歴 scan 禁止） |
| **B** Pre-save Local intent | POST 前に `saveOperationId` durable | **Server 非対応だと result 復元不可** |
| **C** Server idempotency | operationId で create+donguri を一意化 + result API | **Window B の核** |
| **D** Server mirror ledger | Server に mirror 未確認を持つ | **初期非推奨**（generation ID を Server へ持ち込まない） |

---

## 5. Hybrid 比較結果

| Hybrid | Window B/C | 備考 |
| --- | --- | --- |
| A only | C○ / B× | blocker close 不足 |
| B only | 両方△ | Server が operation を知らない限界 |
| B + C | 両方◎ | 構造的本命 |
| **B + C + lightweight A** | 両方◎＋保険 | **比較上の有力候補**（未固定・未実装） |

lightweight A の範囲候補: **既存 month/year list** ∩ Local missing `legacyServerId` → resolve → **既存 mirror outbox** enqueue。  
`updated-since` は **将来オプション**（現状前提にしない）。

---

## 6. 設計方針（候補）

### saveOperationId

opaque / client ULID 等 / user-facing でない / 本文なし。  
Journal stableId・Server cuid・generationId と **別概念**。

### donguri atomicity

operation 成功 = **entry + charge settlement のセット**。  
「entry idempotent・donguri 二重」は不可。

### outbox 責務分離

| Store | 役割 |
| --- | --- |
| save-operation journal（新・候補） | intent / Server result recovery |
| mirror outbox（既存） | `serverEntryId` 確定後の mirror queue |

同一テーブルへ雑に混ぜないことを第一候補とする。

### generation / source_changed

recovery mirror も manifest+registry+lifecycle fail-closed。  
`source_changed` 自動 overwrite 禁止。Local 自動 delete 禁止。

### multi-device / offline / backup

primary device のみ。offline draft ≠ save intent。  
operation journal は backup **exclude** 候補、Moving Package 非含有候補。

### 実行タイミング

foreground / manual 第一。background sync 禁止（初期）。

---

## 7. Release blocker closure criteria

すべて満たして初めて「gap を閉じた」と呼べる:

1. response lost でも duplicate create/charge なしで結果回収  
2. Server-only committed entry を検出可能  
3. 既存 outbox へ再投入可能  
4. kill/relaunch で状態維持  
5. silent data loss なし（勝手な delete/overwrite なし）  
6. generation routing fail-closed 維持  

「reconciliation を書いた」だけでは不可。

---

## 8. 次 Phase 推奨（実装は別 ticket）

1. **Save-operation idempotency PoC（C 中心、B の Local intent を伴う）** — Window B を先に構造化  
2. 並行または直後: **lightweight reconciliation PoC（A）** — 既存 month list のみ、全履歴禁止  
3. Strategy D は見送り  

一般 production rollout / main merge: **不可**（RG-1〜4・gap 未閉）。

---

## 9. Cross-links

- `docs/product/ljd-save-operation-reconciliation-spec.md`  
- `docs/product/ljd-transitional-local-routing-spec.md`  
- `docs/hybrid/HYBRID_PHASE_4B4L_INTERNAL_SAVE_WIRING_POC.md`  
- `docs/hybrid/HYBRID_PHASE_4B4I_LOCAL_MIRROR_OUTBOX_POC.md`  
- `docs/product/ljd-local-mirror-outbox-spec.md`  
- `docs/product/ljd-local-generation-lifecycle-spec.md`  

## 10. A/B（本 Phase 完了判断）

| 問い | 判定 |
| --- | --- |
| B+C+lightweight A を第一候補にできるか | **A（有力候補）** |
| 次に save-operation idempotency PoC へ進めるか | **A** |
| reconciliation PoC を先にすべきか | **B（C が blocker close の本丸；A 単独先は保険のみ）** |
| 一般 production rollout | **B** |
| main 統合 | **B** |
