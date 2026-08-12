/**
 * Phase 4B-4K — Local Journal Generation Registry PoC
 * Branch: feat/local-generation-registry-poc
 * Base: docs/local-journal-generation-lifecycle @ c3dd302
 */

# Hybrid Phase 4B-4K｜Generation Registry PoC

**Status:** Pre-Implementation Local Generation Lifecycle / Source of Truth Candidate  
**production save 配線・candidate rename/delete・build/Simulator・main merge:** 本Phase制約

## Manifest identity 監査（実装前）

`ljd-local-journal-activation.json` の identity フィールド:

| フィールド | 形式 | registry generationId として再利用 |
| --- | --- | --- |
| `generation` | **number**（storage ordinal、現在 `2`） | **不可** |
| `activeDatabaseId` | string（例: `ljd_local_journal_secure_candidate`） | pair キー（DB 表示名） |
| `activeMediaRootId` | string（例: `ljd/media/journal-secure-candidate`） | pair キー |
| `schemaVersion` | number（PRAGMA user_version 期待値） | 検証用 |

**結論:** manifest を破壊的更新しない。registry には新規 opaque `generationId`（`gen_*`）を発行し、`legacyGenerationAlias: manifest-generation:2` で ordinal を記録。

## PoC 実装

| 項目 | 結果 |
| --- | --- |
| Storage | `ljd_local_generation_registry_poc` plain SQLite（Application Support） |
| Encryption | **plain SQLite + NSFileProtectionComplete**（SQLCipher 非必須 — metadata のみ・secret なし） |
| Backup | **iOS backup included**（generation DB/media/manifest と同復元） |
| outbox | backup excluded（4B-4I 維持） |
| Initialize | developer explicit / idempotent / 1 row |
| Lifecycle | manifest 整合時のみ `technical_active` |
| Resolver | `resolveLocalJournalGenerationTargetWithRegistryValidation` |
| Routing allowed | **technical_active のみ**（ready は不可） |
| outstanding count | outbox から **derived**（registry 非永続） |
| Retirement guard | `canRetireGeneration`（実 retire なし） |
| actual DB | 登録・変更禁止 |

## Encryption 比較

| 方式 | 評価 |
| --- | --- |
| **plain SQLite + Complete** | **PoC 採用** — operational metadata、secret なし、backup 同復元 |
| SQLCipher + Complete | 技術的には可だが、registry 内容に鍵で守るべき secret がない。journal DB とは別経路で複雑度増 |

## G1–G7 / unit

| ID | 結果 |
| --- | --- |
| G1 manifest+registry active → resolve PASS | unit PASS |
| G2 registry missing → fail-closed | unit PASS |
| G3 DB mismatch | unit PASS |
| G4 media mismatch | unit PASS |
| G5 quarantined | unit PASS |
| G6 retired | unit PASS |
| G7 multiple technical_active | unit PASS |

## K1–K11（native runner）

`runGenerationRegistryPoc` + diagnostics ボタン実装済み。  
本Phaseは **build/Simulator 禁止**のため native 実行は未実施。次 diagnostics rebuild 後に手動実行可。

## Production routing precondition（確認）

```text
Server success
→ manifest resolve
→ registry validation
→ Resolved generation
→ outbox enqueue
→ mirror
→ ack
```

本 PoC まで **registry validation 層** が成立。save 配線は未接続。

## A/B

| 問い | 候補 |
| --- | --- |
| 独立 generation registry を正式採用候補にできるか | **A** |
| manifest+registry+outbox を production routing precondition にできるか | **A** |
| 次に developer/internal-only save 配線 PoC へ | **A（条件付き）** |
| その前に追加設計が必要か | **B** |
| main 統合 | **B** |

## 次Phase

**developer/internal-only production save 配線 PoC**（registry+outbox+resolve orchestration、feature flag なし developer 限定）。

## Docs

- `docs/product/ljd-local-generation-lifecycle-spec.md`（§24 追記）
- 本ファイル
