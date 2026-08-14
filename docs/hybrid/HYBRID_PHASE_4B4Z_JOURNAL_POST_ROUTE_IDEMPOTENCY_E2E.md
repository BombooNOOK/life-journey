# Hybrid Phase 4B-4Z｜Journal POST Route-Level Idempotency E2E

**Status:** PASS（local disposable DB）  
**Date:** 2026-08-14  
**Prior:** 4B-4Y PASS = A / commit `5d932ab47c4e5946bd5ac7aa0bd78c7b5192adb3`

---

## 1. Purpose

Production 有効化前に、実経路

`cookie → POST /api/journal → JSO → JournalEntry → photo → donguri → HTTP`

を **library 単体ではなく Route Handler** で検証する。

## 2. DB / Gate

| Item | Value |
| --- | --- |
| Target | `127.0.0.1:5433/ljd_dev` only |
| Neon / Production | **禁止** |
| Actors | `*@ljd.invalid` test-only |
| Photo | Blob unset → `photoDataUrl` legacy（Production storage 不使用） |
| Run | `RUN_LOCAL_DB_INTEGRATION=1 npm test -- src/app/api/journal/journalPostRouteIdempotency.e2e.test.ts` |

## 3. Results

| Case | Result |
| --- | --- |
| E2E1 Feature OFF | PASS — legacy 成功、JSO=0（ID ありでも OFF 時は JSO なし） |
| E2E2 Fresh | PASS — 200 / entry1 / JSO1 / charge1 / completed |
| E2E3 Same retry | PASS — reused=true、増殖なし |
| E2E4 Response loss | PASS — same entryId、charge1 |
| E2E5 Concurrent | PASS — 収束（unique conflict は期待どおり handle） |
| E2E6 Fingerprint | PASS — 409、元 operation 破壊なし |
| E2E7 Invalid ID | PASS — 400 `BAD_SAVE_OPERATION_ID`、副作用なし |
| E2E8 Processing | PASS — mid-checkpoint resume、duplicate なし（200 または 202→resume） |
| E2E9 Checkpoints | PASS — entry_created / photo_completed / donguri_settled → completed |
| E2E10 Insufficient | PASS — 下記差分 |
| E2E11 Photo | PASS — first/retry/loss、Blob 未使用・重複なし |
| E2E12 Cross actor | PASS — 同一 opId でも cookie actor で分離 |

### E2E10｜不足時差分（Route）

| | Legacy（flag OFF） | JSO（flag ON） |
| --- | --- | --- |
| 判定タイミング | **事前**残高 check | **charge settlement** |
| HTTP | 402 | 402 |
| JournalEntry | 作らない | 一時作成→不足時 delete（orphan 残さない） |
| JSO | なし | `failed_final` / `ACORN_INSUFFICIENT` |
| Retry | 毎回事前 402 | failed_final 再返却、新 entry なし |

## 4. Account delete 監査（Production deploy 前）

| 観点 | 評価 |
| --- | --- |
| Feature OFF でも JSO delete が動くか | **Yes** — flag 非依存（監査テスト + E2E） |
| 挙動変化 | flag OFF でも account delete が JSO を消す（4B-4Y からの差分） |
| JSO table 不存在 env | TX 全体失敗（Prisma）→ **migrate 未適用 env への本コード deploy は blocker** |
| Production | 4B-4V.1 で table あり → この blocker は **Production では閉じている** |
| failure | deleteMany 失敗は既存どおり `DB_DELETE_FAILED` |

**Verdict:** Production には既に table があるため **deploy blocker ではない**。Preview 等で migrate 未適用の env があるなら、コード同梱前に migrate 必須。

## 5. Final invariants

Test fixture cleanup 後：`@ljd.invalid` の entry / JSO / diary_save charge = 0。

## 6. Build / regression

| Check | Result |
| --- | --- |
| Route E2E (14) + audit (2) | **PASS**（RUN_LOCAL_DB_INTEGRATION=1） |
| saveIdempotency + local-first + audit | **224 passed** / 10 skipped |
| `tsc --noEmit` | **PASS** |
| `next build` | **PASS** |

## 7. Next

Production **internal route verification plan** へ進めるか → 完了報告の A/B。

**禁止維持:** Production POST / feature enable / Neon / deploy / main merge。
