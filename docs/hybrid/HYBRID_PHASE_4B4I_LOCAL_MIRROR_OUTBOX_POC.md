/**
 * Phase 4B-4I — Local Mirror Pending Outbox PoC
 * Branch: feat/local-mirror-outbox-poc
 * Base: docs/production-transitional-local-routing @ 90a4a8c
 */

# Hybrid Phase 4B-4I｜Local Mirror Pending Outbox PoC

**Status:** Pre-Implementation Transitional Mirror Outbox / Source of Truth Candidate  
**本番 save 配線・background retry・Local read 切替・main merge:** なし

## 目的

Server 保存後の Local mirror pending を、**独立 outbox** に安全に保持・手動 retry できる薄い PoC。  
**enqueue-before-mirror** を実証（crash window で pending を失わない）。

## 実装要約

| 項目 | 結果 |
| --- | --- |
| Storage | `ljd_local_mirror_outbox_poc` SQLCipher（Application Support） |
| Protection | NSFileProtectionComplete |
| Backup | **exclude from iOS backup（候補 A）** / Moving Package 非含有 |
| Schema | id / serverEntryId / targetGenerationId + generation snapshot / retry 系 |
| Unique | `(serverEntryId, targetGenerationId)` |
| Enqueue timing | resolve → **enqueue** → mirror → ack |
| Lifecycle | success ack; fail retain; source_changed=attention_required; missing=source_missing |
| Retry | developer/manual foreground only |
| Generation drift | pinned; silent retarget 禁止 |
| Corrupt manifest | fail-closed（snapshot 単独 open なし） |
| Canonical data | Server GET only |
| Donguri | 非再処理（create API 不呼出） |
| Production save / UI | 未接続 |
| Actual DB | 無変更 |
| RG-1〜4 | 未完のまま |

## Crash windows（fixture / PoC）

| ID | 内容 | 結果 |
| --- | --- | --- |
| O1 | enqueue → mirror 前 kill | relaunch 後 pending 残存 |
| O2 | mirror 成功 → ack 前 kill | relaunch retry → already_present → ack |
| O3 | mirror 失敗 | pending 保持 + retryCount |
| O4 | retry 成功 | pending 消去 |

## Simulator Q1–Q12

`runLocalMirrorOutboxPoc`（diagnostics 起動時 / ボタン）。  
既存テスト entry `cmsppllhx0000kv04nmct79ak` 再利用。新規一般あしあと不要。

| Step | 結果 |
| --- | --- |
| Q1 empty + encrypted/Complete/backupExcluded | **PASS** |
| Q2 fixture enqueue | **PASS** |
| Q3 kill/relaunch persistence | **PASS** |
| Q4 mirror attempt → already_present ack | **PASS** |
| Q5 failure → retry_needed（既 mirrored 時は simulated retain） | **PASS** |
| Q6 retry → already_present | **PASS** |
| Q7 ack/remove | **PASS** |
| Q8 duplicate enqueue | **PASS** |
| Q9 mirror後 ack前 relaunch → already_present → ack | **PASS** |
| Q10 generation drift / no silent retarget | **PASS** |
| Q11 actual DB 無変更 | **PASS** |
| Q12 general UI / production save 無変更 | **PASS** |

**FAILS = 0**（Simulator 2026-08-12）

## Tests

`LocalMirrorOutboxService.test.ts` — enqueue / idempotency / reopen / lifecycle / drift / source_changed / source_missing / plaintext reject / no content / no donguri。  
4B-4E/F/G regression 維持。

## A/B（完了時判断用）

| 問い | 候補 |
| --- | --- |
| 独立 outbox を正式採用候補にできるか | **A** |
| enqueue-before-mirror を正式方針にできるか | **A** |
| 次に developer/internal-only production save 配線 PoC へ | **B（条件付き）** — generation lifecycle の薄い設計を先に検討してもよい |
| その前に generation lifecycle 追加設計 | **A（推奨）** — pending pin と drift 処理のため |
| main 統合 | **B（不可）** |

## Docs

- `docs/product/ljd-local-mirror-outbox-spec.md`
- 本ファイル
- cross-link: transitional routing / write-routing / activation
- 後続: `docs/hybrid/HYBRID_PHASE_4B4L_INTERNAL_SAVE_WIRING_POC.md`（internal save wiring）
- 後続: `docs/hybrid/HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md`（gap closure 設計）
- 後続: `docs/product/ljd-save-operation-reconciliation-spec.md`
