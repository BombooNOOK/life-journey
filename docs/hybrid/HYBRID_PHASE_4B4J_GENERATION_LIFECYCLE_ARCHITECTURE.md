/**
 * Phase 4B-4J — Local Journal Generation Lifecycle Architecture Review
 * Branch: docs/local-journal-generation-lifecycle
 * Base: feat/local-mirror-outbox-poc @ 46e5a44
 * Scope: docs only — no registry impl, rename, delete, build, Simulator, main merge
 */

# Hybrid Phase 4B-4J｜Generation Lifecycle Architecture

**Status:** Pre-Implementation Local Generation Lifecycle / Source of Truth Candidate

## 目的

DB + media root を **1 論理 generation** として扱う lifecycle を設計する。  
outbox pin・activation manifest・将来 retirement との関係を文書化し、production save 配線前の Gate を明確化する。

## 第一候補サマリ

| 項目 | 第一候補 |
| --- | --- |
| States | staged / ready / technical_active / previous / retirement_blocked / retired / quarantined |
| Active pointer | **manifest のみ**（registry は二重 pointer にしない） |
| Previous | rollback 保険。即 retire/削除しない |
| Outstanding outbox | `> 0` → **retirement_blocked**。silent drop / retarget 禁止 |
| 切替後 | old pending→A、new save→B の併存は正当 |
| Previous vs retired | 分離。retired ≠ 即削除 |
| Quarantine | routing 禁止。自動 repair/削除/fallback 禁止 |
| Metadata | **独立 generation registry**。manifest は小さく。outbox に混ぜない |
| outstanding count | **derived from outbox** |
| generationId | opaque ULID。既存 candidate **rename しない** |
| 不整合 | fail-closed。silent fallback 禁止 |
| Activation crash | manifest atomic 優先 + registry 順序設計 |
| Rollback + pending | B pin を A へ移さない |
| Backup/restore | outbox 欠落 → reconciliation Gate（RG-2/3 接続） |
| Moving Package | active のみ。previous/retired/quarantined/outbox 非含有 |
| SoT | 本設計は **Server-authoritative**。Local-authoritative と混同しない |
| Deletion | 将来・明示・auto cleanup 禁止 |

## Production routing precondition（最低限）

1. target が active/ready 経路上で健全  
2. registry ↔ manifest 整合  
3. retired/quarantined でない  
4. enqueue 後 pin 維持  

## A/B（完了報告用）

| 問い | 候補 |
| --- | --- |
| generation lifecycle 方式を採用候補にできるか | **A** |
| 独立 generation registry を採用候補にできるか | **A** |
| 次に developer/internal-only production save 配線 PoC へ | **B（条件付き）** |
| その前に generation registry 実装 PoC が必要か | **A（推奨）** — pin/retire Gate をコードで固定するため |
| main 統合 | **B（不可）** |

## 次Phase推奨

薄い **generation registry PoC**（既存 candidate を 1 row 登録・rename なし・delete なし）→ その後 developer/internal-only save 配線。

## Docs

- `docs/product/ljd-local-generation-lifecycle-spec.md`
- 本ファイル
- cross-link: activation / transitional routing / outbox / write-routing
