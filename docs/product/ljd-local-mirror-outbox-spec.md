/**
 * Life Journey Diary｜Local Mirror Outbox (Transitional)
 *
 * Status: Pre-Implementation Transitional Mirror Outbox / Source of Truth Candidate
 * Updated: 2026-08-12
 * Branch: feat/local-mirror-outbox-poc
 * Base: docs/production-transitional-local-routing @ 90a4a8c
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4I_LOCAL_MIRROR_OUTBOX_POC.md
 * - docs/product/ljd-transitional-local-routing-spec.md
 */

# Life Journey Diary｜Local Mirror Outbox

**Status:** Pre-Implementation Transitional Mirror Outbox / Source of Truth Candidate  
**ラベル:** **PoC implemented (developer-only)**／**Designed candidate**／**Forbidden now**＝production save 配線・background retry・Local read 切替

---

## 0. 位置づけ

| 項目 | 状態 |
| --- | --- |
| Server = Source of Truth | 維持 |
| Local = encrypted mirror | 維持 |
| Independent dual-write | 不採用 |
| Production Journal save 配線 | **未接続（禁止）** |
| General Journal UI | Server read/write のまま |
| Outbox | **独立 metadata SQLite（PoC）** |

将来 production 配線時の第一順序:

```text
Server success
→ generation resolve
→ outbox enqueue
→ mirror
→ success 時 ack/remove
```

**enqueue-before-mirror** を正式方針候補とする。  
mirror 失敗後に初めて pending を作らない（Server 成功〜mirror 開始前の kill で失わないため）。

---

## 1. Storage

| 項目 | PoC |
| --- | --- |
| 方式 | Application Support 内 **独立小 SQLite** |
| PoC DB 名 | `ljd_local_mirror_outbox_poc` |
| Journal life-record DB 混在 | **しない** |
| activation manifest 混在 | **しない** |
| localStorage / sessionStorage | **禁止** |

---

## 2. Security

| 項目 | 第一候補 / PoC |
| --- | --- |
| 配置 | Application Support |
| File Protection | `NSFileProtectionComplete` |
| 暗号化 | **SQLCipher**（plugin `mode:"secret"` + built-in Keychain） |
| Secret 露出 | アプリコード・ログへ出さない |
| Moving package key | 別（outbox は含めない候補） |

「小さい metadata だから平文でよい」とはしない。既存 Security Foundation と整合。

---

## 3. Backup policy（PoC 結論）

| 案 | 評価 |
| --- | --- |
| **A exclude from iOS backup** | **第一候補（A）** — transient operational queue。restore 後の stale pending replay を避ける。Server 原本から必要なら再配線で再構築し得る |
| B include in backup | generation 不整合・stale replay リスク |
| Moving Package | **原則含めない** |

---

## 4. Schema（最小 + generation snapshot）

| 列 | 必須 |
| --- | --- |
| id | yes |
| serverEntryId | yes |
| targetGenerationId | yes（opaque; PoC は `databaseId`） |
| targetDatabaseId | yes（snapshot） |
| targetMediaRootId | yes |
| targetSchemaVersion | yes |
| manifestChecksumAtEnqueue | yes |
| requestedAt | yes |
| retryCount | yes |
| lastResult | nullable |
| lastAttemptAt | nullable |
| createdAt | yes |

**UNIQUE(serverEntryId, targetGenerationId)** — 重複 enqueue しない。

**禁止:** 本文・写真・caption・email・secret / cookie。

retry 時は **Server canonical GET** → mirror primitive。

`targetGenerationId` だけでは registry 未整備のため、非 secret の generation snapshot を保持して identity 検証する。

---

## 5. Lifecycle

```text
pending → mirror attempt → mirrored|already_present → ack/remove
pending → attempt fail → retry_needed（row 保持・count++）
source_changed → attention_required（自動 overwrite 禁止・row 保持）
source_missing → source_missing（Local delete しない）
generation drift → generation_changed（silent retarget 禁止）
corrupt resolve → target_unavailable（snapshot 単独 open 禁止）
```

`processing` 永続 state は初期 PoC では持たない（kill 後永久停止を避ける単純化）。

---

## 6. Retry

| 許可 | 禁止 |
| --- | --- |
| developer / manual foreground | background task |
| （将来）安全な foreground タイミング | timer / network listener 自動 sync / silent infinite retry |

Outbox retry は **Local mirror のみ**。Server create API 再実行なし → **どんぐり再消費なし**。

---

## 7. Generation / fail-closed

- pending は **作成時 generation に固定**
- active が B へ変わっても **B へ silent retarget 禁止**
- corrupt manifest 時、outbox snapshot を **fallback routing table にしない**
- plaintext `ljd_local_journal` は enqueue / attempt とも拒否

---

## 8. Observability（非個人）

enqueue / retry / mirrored / already_present / failed / source_changed / generation_changed  
serverEntryId はログで redact（先頭・末尾のみ）。本文・写真・secret は出さない。

---

## 9. 実装参照

- `src/lib/local-first/journal/outbox/*`
- diagnostics: Q1–Q12 `runLocalMirrorOutboxPoc`

**関連:**  
- `docs/product/ljd-transitional-local-routing-spec.md`  
- `docs/product/ljd-local-journal-write-routing-spec.md`  
- `docs/product/ljd-local-journal-activation-spec.md`
