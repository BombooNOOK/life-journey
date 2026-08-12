/**
 * Phase 4B-4L — Developer/Internal-only Production Save Wiring PoC
 * Branch: feat/internal-journal-save-mirror-wiring-poc
 * Base: feat/local-generation-registry-poc @ 1a21e9c
 */

# Hybrid Phase 4B-4L｜Internal Save Mirror Wiring PoC

**Status:** **正式 PASS**（native/live L1–L13、FAILS=0）  
**一般 production rollout / Local read 切替 / main merge:** なし（RG-1〜4 未完）

## 目的

既存 **Server-only** の「あしあとを森に残す」保存成功後に、**developer/internal gate 有効時のみ** Local mirror orchestration を接続する薄い PoC。

Server transaction（create → photo → donguri → 200 OK）は**変更しない**。

## Internal gate

| 条件 | 必須 |
| --- | --- |
| Capacitor native | ✓ |
| `NEXT_PUBLIC_INTERNAL_JOURNAL_SAVE_MIRROR=1` | ✓ |

flag OFF または Web → 既存 Server save と**完全同一**（`disabled` を即返却）。

- UID / email の hardcode なし
- `.env.local` は commit しない
- Vercel production deploy 禁止（local dev Server + Capacitor LAN で検証）

## Application orchestration 境界

```
UI (CompanionWritingPage / journal/page)
  → res.ok && entry.id 後に fire-and-forget
  → handleConfirmedServerJournalMirror (application service)
       → assertSaveMirrorRoutingPreconditions
       → enqueueBeforeMirror
       → attemptOutboxMirror (GET + mirror primitive)
       → ack | retain
```

- UI に Local DB / outbox 処理を直接書かない
- mirror primitive は manifest/registry を読まない
- Local result ≠ Server save success（混同しない）

## Routing precondition（fail-closed）

- manifest valid
- registry row 存在 + pair 一致
- lifecycle = `technical_active`
- integrity PASS
- encrypted candidate preflight PASS

不成立 → `routing_unavailable`（**Server 保存は成功のまま**、silent fallback なし）

### encryption_unknown bounded retry（live 最小修正）

`assertSaveMirrorRoutingPreconditions` のみ:

| 制約 | 内容 |
| --- | --- |
| Bounded | **最大 1 回**の再 inspect（400ms 後） |
| 対象 | `health.status === "abnormal"` かつ `reason === "encryption_unknown"` のみ |
| 再試行後も不明 | **fail-closed**（`candidate_preflight_failed`） |
| plaintext | **fallback しない** |
| production 条件 | `exists` + `encrypted === true` + `ready` は緩和しない |

## Outbox（4B-4I 再利用）

順序: **enqueue → mirror → ack**  
Unique: `(serverEntryId, targetGenerationId)`  
Generation pin: enqueue 時 identity 固定、silent retarget 禁止

## Result 候補

| status | 意味 |
| --- | --- |
| `disabled` | gate OFF |
| `routing_unavailable` | manifest/registry/preflight 不成立 |
| `mirrored` | mirror 成功 → ack |
| `already_present` | 冪等 → ack |
| `queued_retry` | pending 保持（retry_needed 等） |
| `attention_required` | source_changed 等 |

## Local failure / retry

- Developer injection: **enqueue 後・Local save 前**（`injectLocalFailureAfterEnqueue`）
- Server entry / donguri は 1 回のみ（create API 再実行なし）
- Manual foreground retry: `retryPendingServerJournalMirror` → GET → pinned generation → mirror → ack

## Residual gap（未解決・Release Blocker 候補）

**`SERVER_SUCCESS_TO_OUTBOX_GAP`** — **未解決のまま保持**

Server 200 OK + `entry.id` 確定後、**durable outbox enqueue 前**に process kill すると Server-only entry が残り得る。

- 本 Phase では**解決しない**（正式 PASS でも gap は閉じない）
- `developer.simulateCrashBeforeEnqueue` fixture でモデル化
- 次 Phase: reconciliation / gap closure 設計

## Test entry（live native）

- タグ: `#SaveWiringTest`
- **明示した 1 件のみ**（個人情報なし、写真 1 枚可）
- entry id は当該 save response → `save-wiring-test-entry-id.txt`（一般あしあと検索・代用禁止）
- **local dev Server**（Vercel production deploy なし）

## Unit tests

`handleConfirmedServerJournalMirror.test.ts` — gate OFF / routing fail-closed / SERVER_SUCCESS_TO_OUTBOX_GAP / enqueue-before-mirror / Local failure → pending / retry / already_present / drift / no secret。  
4B-4E/F/G/I/K regression 維持。

## Simulator L1–L13（正式結果）

**正式 PASS 方法:** Capacitor `server.url` を  
`http://127.0.0.1:3000/preview/save-wiring-poc` に指定して起動（same-origin session）。  
`simctl openurl` 単体では WebView 外に開くことがあり **レポート未生成 → 正式結果に含めない**。

`runInternalSaveMirrorWiringPoc` — **FAILS = 0**（2026-08-13、明示 `#SaveWiringTest` 1 件）

| Step | 結果 | 内容 |
| --- | --- | --- |
| L1 | **PASS** | internal gate ON + native |
| L2 | **PASS** | 当該 entry Server GET |
| L3 | **PASS** | entry id（save response 由来） |
| L4 | **PASS** | manifest + registry resolve |
| L5 | **PASS** | outbox enqueue |
| L6 | **PASS** | Local failure → `queued_retry` / `retry_needed` |
| L7 | **PASS** | pending=1、donguri 再処理なし |
| L8 | **PASS** | pending 維持（inject 後 outbox reopen） |
| L9 | **PASS** | manual retry → `mirrored` |
| L10 | **PASS** | ack 後 pending=0 |
| L11 | **PASS** | Local candidate `legacyServerId` hit |
| L12 | **PASS** | actual plaintext DB 無変更 |
| L13 | **PASS** | general read = Server 維持 |
| GAP | **PASS（未解決明記）** | `SERVER_SUCCESS_TO_OUTBOX_GAP` Release Blocker 候補 |

## Cross-links

- [Transitional routing spec](../product/ljd-transitional-local-routing-spec.md)
- [Outbox PoC](./HYBRID_PHASE_4B4I_LOCAL_MIRROR_OUTBOX_POC.md)
- [Generation registry PoC](./HYBRID_PHASE_4B4K_GENERATION_REGISTRY_POC.md)
- [Generation lifecycle](./HYBRID_PHASE_4B4J_GENERATION_LIFECYCLE_ARCHITECTURE.md)

## A/B

| 問い | 判定 |
| --- | --- |
| 4B-4L 正式 PASS | **A** |
| internal save wiring 方式を採用候補 A にできるか | **A**（internal/developer 限定） |
| 次に reconciliation / gap closure 設計へ | **A（推奨）** — `SERVER_SUCCESS_TO_OUTBOX_GAP` 残存 |
| 一般 production rollout | **B** — RG-1〜4 未完・gap 未閉 |
| main 統合 | **B** |
