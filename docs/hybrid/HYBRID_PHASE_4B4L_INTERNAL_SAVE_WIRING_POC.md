/**
 * Phase 4B-4L — Developer/Internal-only Production Save Wiring PoC
 * Branch: feat/internal-journal-save-mirror-wiring-poc
 * Base: feat/local-generation-registry-poc @ 1a21e9c
 */

# Hybrid Phase 4B-4L｜Internal Save Mirror Wiring PoC

**Status:** Developer/Internal-only save mirror wiring PoC  
**一般 production rollout / Local read 切替 / main merge:** なし

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

**`SERVER_SUCCESS_TO_OUTBOX_GAP`**

Server 200 OK + `entry.id` 確定後、**durable outbox enqueue 前**に process kill すると Server-only entry が残り得る。

- 本 Phase では**解決しない**
- `developer.simulateCrashBeforeEnqueue` fixture でモデル化
- 次 Phase: reconciliation / gap closure 設計

## Test entry（live native）

- タグ: `#SaveWiringTest`
- 1 件のみ（個人情報なし、写真 1 枚可）
- Simulator: `Library/ljd/security-poc/save-wiring-test-entry-id.txt` に entry id を書き込み
- **local dev Server** で保存（Vercel production deploy 不要）
- 一般あしあとの代用禁止

## Unit tests

`handleConfirmedServerJournalMirror.test.ts`:

- gate OFF
- routing fail-closed
- SERVER_SUCCESS_TO_OUTBOX_GAP fixture
- enqueue-before-mirror
- Local failure → pending
- manual retry / already_present
- generation drift no-retarget
- no secret logging

## Simulator L1–L13

`runInternalSaveMirrorWiringPoc`（diagnostics ボタン）

| Step | 内容 |
| --- | --- |
| L1 | internal gate ON |
| L2 | #SaveWiringTest Server entry GET |
| L3 | entry id 取得 |
| L4 | manifest + registry resolve |
| L5 | outbox enqueue |
| L6 | injected Local failure |
| L7 | Server/donguri 無変更 |
| L8 | pending 維持（relaunch read） |
| L9 | manual retry → mirror success |
| L10 | ack 後 outbox 0 |
| L11 | Local entry/media |
| L12 | actual plaintext DB 無変更 |
| L13 | general read = Server 維持 |
| GAP | SERVER_SUCCESS_TO_OUTBOX_GAP 明記 |

L2 で entry id 未設定時は **skip + ユーザー案内**（実 save は Cursor が代行しない）。

## Cross-links

- [Transitional routing spec](../product/ljd-transitional-local-routing-spec.md)
- [Outbox PoC](./HYBRID_PHASE_4B4I_LOCAL_MIRROR_OUTBOX_POC.md)
- [Generation registry PoC](./HYBRID_PHASE_4B4K_GENERATION_REGISTRY_POC.md)
- [Generation lifecycle](./HYBRID_PHASE_4B4J_GENERATION_LIFECYCLE_ARCHITECTURE.md)

## A/B（完了時判断用）

| 問い | 候補 |
| --- | --- |
| internal save wiring 方式を採用候補 A にできるか | 要 native L2–L11 PASS |
| 次に reconciliation / gap closure 設計へ | **A（推奨）** — SERVER_SUCCESS_TO_OUTBOX_GAP 残存 |
| 一般 production rollout | **B** — RG-1〜4 未完 |
| main 統合 | **B** |
