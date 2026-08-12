/**
 * Life Journey Diary｜Local Journal Transitional Write Routing
 *
 * Status: Pre-Implementation Transitional Write Routing / Source of Truth Candidate
 * Updated: 2026-08-12
 * Companion: docs/product/ljd-local-journal-activation-spec.md (4B-4C)
 * Evidence base: 4B-4A/4B encrypted candidate + Server GET multi-copy @ 13ab0cb
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: design comparison only for post-activation *transitional* write routing.
 *        No write implementation, Server/Local write tests, pointer impl, builds,
 *        Simulator, Local原本化, or RG PASS.
 *
 * 親方針:
 * - docs/product/ljd-product-worldview-source-of-truth.md
 * - docs/product/ljd-local-first-and-moving-policy.md
 * - docs/product/ljd-moving-package-spec.md
 * - docs/product/ljd-local-data-security-spec.md
 * - docs/product/ljd-local-journal-activation-spec.md
 */

# Life Journey Diary｜Local Journal Transitional Write Routing

**Status:** Pre-Implementation Transitional Write Routing / Source of Truth Candidate  
**ラベル:** **Designed candidate**＝移行期間の第一候補／**Future**＝Local-first 最終形／**Open**＝未確定／**Forbidden now**＝本Phase実装禁止／**Release Gate**＝未実証（PASS禁止）  
**PoC (4B-4E):** developer-only write-through mirror **PASS**（一般 Journal save 未接続）。  
**PoC (4B-4G):** developer-only resolve → mirror target integration **PASS**（production routing 未接続）。  
証拠: `docs/hybrid/HYBRID_PHASE_4B4G_GENERATION_RESOLVER_INTEGRATION_POC.md`

**関連:**  
- Activation（technical vs SoT）: `docs/product/ljd-local-journal-activation-spec.md`  
- Hybrid メモ: `docs/hybrid/HYBRID_PHASE_4B4D_WRITE_ROUTING_ARCHITECTURE.md`  
- Write-through PoC: `docs/hybrid/HYBRID_PHASE_4B4E_WRITE_THROUGH_MIRROR_POC.md`  
- Generation resolver integration: `docs/hybrid/HYBRID_PHASE_4B4G_GENERATION_RESOLVER_INTEGRATION_POC.md`  
- **Production transitional routing（4B-4H 設計）:** `docs/product/ljd-transitional-local-routing-spec.md`  
  ／ `docs/hybrid/HYBRID_PHASE_4B4H_PRODUCTION_ROUTING_ARCHITECTURE.md`  
- **Generation lifecycle（4B-4J 設計）:** `docs/product/ljd-local-generation-lifecycle-spec.md`  
  ／ `docs/hybrid/HYBRID_PHASE_4B4J_GENERATION_LIFECYCLE_ARCHITECTURE.md`

---

## 0. 今回決めること / 決めないこと

### 0.1 決める（移行期間）

Technical activation（Repository が encrypted Local generation を *読める*）のあと、**当面 Server が原本のまま**の期間に、**新規あしあと write をどこへ・どの順で流すか**。

### 0.2 決めない（別 Phase / Gate）

- Local-first write への最終切替（Source-of-Truth switch の write 側）
- offline write 製品化、conflict engine、Web read-only 化
- activation pointer / Repository 切替の実装
- RG-1〜4 の PASS 扱い変更

前提（4B-4C）:

- DB/media は **generation 単位**
- active は Application Support **manifest pointer**
- technical activation ≠ Local原本化
- Server = 現在の原本、RG-1〜4 未完

---

## 1. Strategy 比較

### Strategy A｜Server write only

従来どおり Server API のみへ保存。Local へは後から別 copy / migration。

| 観点 | 評価 |
| --- | --- |
| Server 原本維持 | 強い |
| Local 鮮度 | 弱い。activation 済み Local read とすぐ乖離 |
| 実装単純さ | 高い |
| ユーザー体験 | 「保存したのに Local 一覧に出ない」が起きやすい |
| 移行期適合 | technical activation と併用すると不整合が目立つ |

**判定:** 移行期の単独第一候補にはしない（activation 後の Local read と衝突）。

### Strategy B｜Independent dual-write

1 回の保存操作で Server と Local へ **独立に** write。

| 観点 | 評価 |
| --- | --- |
| partial success | Server OK / Local NG、逆も起こる。どちらが正か不明瞭 |
| retry | 二重投稿・二重 media になりやすい |
| duplicate | `legacyServerId` なしの Local 先行や Server 二重で壊れやすい |
| divergence | content / photo hash が経路ごとにズレうる |
| transaction | 横断 ACID **不能** |

**判定:** **第一候補にしない。** 移行期の正式 write 経路として採用しない。

### Strategy C｜Server-authoritative write-through mirror（第一候補）

1. 従来の **Server API へ保存**（認証済み・既存経路）
2. Server 保存成功を確認
3. Server が確定した entry（cuid / `updatedAt` / canonical fields）を取得
4. encrypted Local **active（または candidate）generation** へ **mirror**
5. 写真も Server 確定 → canonical bytes 取得 → **同一 hash** で generation media root へ mirror

| 観点 | 評価 |
| --- | --- |
| Server 原本 | 維持。失敗時も Server 記録を rollback しない |
| Local 鮮度 | mirror 成功で追従。失敗は pending（§2） |
| 既存 API | 再利用しやすい（4B-2C/4B GET/copy と同型） |
| ID | Server cuid → Local は新 ULID + `legacyServerId`（既存方針） |
| dual-write との差 | Local は「独立創作」ではなく **Server 確定の写し** |

**判定:** **移行期間の第一候補。**

### Strategy D｜Local-first write（将来）

まず Local encrypted DB へ保存し、後で Server 等へ反映。

| 観点 | 評価 |
| --- | --- |
| 最終思想 | Local-first / 手元原本に最も近い |
| いま採らない理由 | RG 未完、offline write・conflict・recovery 未設計、**Server 原本期間中** |
| ID 連続性 | この時点から Local ULID が primary。移行後も `legacyServerId` は照合用に残せる |

**判定:** **Future / Source-of-Truth switch 側の候補。** 移行期第一にはしない。

---

## 2. Strategy C：Server 成功 + Local mirror 失敗

**原則: Server 保存を rollback しない。**  
移行期間の原本は Server。Local は写し（控え）。

### 2.1 望ましい扱い

| 状態 | 動作 |
| --- | --- |
| Server OK, Local OK | 完了。Local に `source=migrated_server`（または将来 `mirrored_server`）相当 |
| Server OK, Local NG | **Server は残す。** Local に未反映を記録し retry 対象にする |
| Server NG | Local へ先行書きしない（C の定義）。ユーザーには Server 失敗を返す |

### 2.2 mirror pending 設計（概念・未実装）

Local 側（generation DB または小さな outbox）に持ちうる状態の例:

| フィールド概念 | 意味 |
| --- | --- |
| `mirror_pending` | Server 確定済みだが Local row/media 未完 |
| `retry_needed` | 自動/手動再試行が必要 |
| `legacyServerId` | Server cuid（dedupe 鍵） |
| `lastMirroredServerUpdatedAt` | 最後に成功 mirror した Server `updatedAt` |
| `mirrorFailureCode` | 容量・checksum・encrypted open 等（secret なし） |

**今回は sync engine を実装しない。**  
設計上「pending が必要になり得る」ことと、**retry は同じ Server entry の再 mirror（idempotent / `legacyServerId` dedupe）** で足りることを確認する。  
複雑な outbox DB は必須前提にしない（4B-4B の明示 ID 再実行と同型で resume 可能）。

### 2.3 禁止

- Server 成功後に「Local が失敗したから Server delete」  
- Local に仮 ID だけで正式 UI 完了とし、Server 未確定のまま放置（C ではない）  
- independent dual-write へのフォールバック

---

## 3. Local read との整合（technical activation 後）

問題: Repository が Local-only を読むと、Server 保存直後で mirror 未完のあしあとが一時的に見えない。

| 案 | 評価 |
| --- | --- |
| mirror 成功まで保存完了 UI を閉じない | UX は単純。長時間化・失敗時の扱いが重い |
| Local 反映後に通常画面へ戻る | 上に近い。失敗時は pending 案内が必要 |
| Server fallback read | 実装複雑・二重ソース表示 |
| pending 表示 | 必要になり得るが製品コピー未確定 |
| **technical activation 中は一般 Journal UI をまだ Local-only read にしない** | **初期 PoC 第一候補** |

### 3.1 初期 PoC 第一候補（読取）

> activation **pointer を（developer-only で）実装しても、一般 Journal UI は当面 Server（既存 Web/API）読取のまま**とする。  
> Local generation は diagnostics / 検証経路でのみ読む。

これにより「保存したのに一覧に出ない」を製品面で起こさず、write-through mirror と pointer を分離検証できる。

製品の Local-only read 切替は、mirror 信頼性・pending UX・SoT 方針が揃ってから。

---

## 4. Identity（stableId）

### 4.1 Server 原本期間（Strategy C）

既存方針を維持:

- Server cuid を Local の永久 ID にしない
- mirror 時: **新 Local ULID `stableId`** + **`legacyServerId` = Server cuid**
- dedupe / resume: `legacyServerId` 第一鍵（4B-4B 実証）

### 4.2 将来 Local-first write（Strategy D）への連続性

| 期間 | primary identity |
| --- | --- |
| 移行期 C | Server cuid（原本）。Local ULID は端末世代内 ID |
| 将来 D | **最初から Local ULID が primary**。Server へ送る場合は別フィールドで紐付け |

連続性: どちらの期間も「Local 行は ULID を持つ」。違いは **どちらが権威か**。  
C→D 切替時に全件の primary を書き換える必要はなく、「新規は Local ULID 権威」「既存 mirrored 行は legacyServerId 照合を維持」で接続できる（詳細 Open）。

---

## 5. Media mirror

**第一候補（C とセット）:**

1. Server で写真確定（既存 upload / Blob 経路）
2. canonical photo bytes を GET（既存 photo API）
3. SHA-256
4. active/candidate **generation media root** へ write
5. 再読込で checksum 一致
6. Local `mediaRefs` に relative path + checksum

**避ける:** Server 用と Local 用に独立した別画像処理パイプラインをかけ、hash が変わる設計。  
表示用リサイズが必要なら **派生物** として原本 hash と分離（既存人生原本方針と整合）。

---

## 6. technical activation との順序

| 案 | 内容 | 評価 |
| --- | --- | --- |
| 1. pointer activation PoC 先 | 読取切替が先。write 未定義のまま Local-only に寄せると欠損 UX | 単独先行は弱い |
| 2. write-through mirror PoC 先 | Server 権威のまま Local generation を温める。4B-4B の延長 | 強い |
| 3. developer-only pointer + write-through 統合 | 同時検証。範囲が広い | 後期 |

**現時点の第一候補順序:**

1. **write-through semantics を本SoTで確定**（本Phase）  
2. **write-through mirror PoC**（明示テスト entry・generation 固定・一般 UI は Server read のまま）  
3. **developer-only activation pointer PoC**（一般 Journal はまだ Local-only にしない）  
4. 並行検証・RG・write 先最終化の後に Source-of-Truth / Local-first write

---

## 7. Local-first write へ切り替える条件（別 Release Gate）

Strategy D への切替は **Source-of-Truth switch の一部**であり、technical activation 成功だけでは足りない。

最低限そろえるもの（初期リスト・Open）:

| 条件 | ねらい |
| --- | --- |
| backup 中身検証（RG-2 系） | 端末防衛線 |
| restore 後 open（RG-3 系） | 復元可能性 |
| Local write persistence（kill/relaunch） | 手元保存の信頼性 |
| offline write 方針 | 通信断時の権威 |
| recovery / 破損時 fail-closed | 黙ったデータ喪失防止 |
| conflict policy | 多端末・再 mirror・再編集 |
| mirror / outbox 枯渇または不要化 | 移行完了判定 |

**RG-1〜4 の定義・PASS 状態は本Phaseで変更しない。**  
上記は「将来 Gate に昇格しうるチェックリスト」であり、いま PASS 扱いしない。

---

## 8. 禁止（移行設計 Phase / 製品接続）

一般 Journal save への mirror 組込み、independent dual-write、pointer / Repository 切替、Local原本化、background sync、main merge。

**4B-4E:** developer-only write-through mirror PoC（candidate のみ・明示 ID）は許可。詳細は `docs/hybrid/HYBRID_PHASE_4B4E_WRITE_THROUGH_MIRROR_POC.md`。

---

## 9. 矛盾時の優先

世界観 → Local-first 方針 → お引越し便 → 端末保存・復元 → データ保護 SoT → **activation SoT** → **本 write-routing SoT（候補）** → Hybrid メモ → コード。

---

## 10. 4B-4E PoC 進捗（追記）

| 項目 | 状態 |
| --- | --- |
| 共通 primitive `mirrorServerJournalEntryToLocalGeneration` | 実装 |
| historical copy 再利用 | 実装（`copied` ← `mirrored`） |
| `MirrorResult.needsRetry` | 実装（queue なし） |
| Local failure injection | 実装（unit + Simulator PASS） |
| 一般 UI 接続 | なし |
| Simulator W1–W10 | **PASS**（entry `cmsppllhx0000kv04nmct79ak`） |
| 証拠メモ | `docs/hybrid/HYBRID_PHASE_4B4E_WRITE_THROUGH_MIRROR_POC.md` |

---

## 11. 4B-4G developer-only resolver → mirror（追記）

| 項目 | 状態 |
| --- | --- |
| `ResolvedLocalJournalGeneration` | 実装 |
| resolve → fixed target → mirror | developer-only PASS |
| production Journal save / Repository | **未接続** |
| R1–R10 Simulator | **PASS** |
| 証拠 | `docs/hybrid/HYBRID_PHASE_4B4G_GENERATION_RESOLVER_INTEGRATION_POC.md` |
---

## 12. 4B-4I Local mirror outbox（追記）

| 項目 | 状態 |
| --- | --- |
| 独立 SQLCipher outbox | PoC `ljd_local_mirror_outbox_poc` |
| enqueue-before-mirror | 方針実証 |
| production Journal save | **未接続** |
| 証拠 | `docs/product/ljd-local-mirror-outbox-spec.md` ／ `docs/hybrid/HYBRID_PHASE_4B4I_LOCAL_MIRROR_OUTBOX_POC.md` |


---

## 13. 4B-4J generation lifecycle（追記）

| 項目 | 状態 |
| --- | --- |
| independent generation registry | 設計候補 |
| outstanding outbox → retirement_blocked | 設計 |
| production save 配線 | **未接続** |
| 証拠 | `docs/product/ljd-local-generation-lifecycle-spec.md` || 証拠 | `docs/product/ljd-local-generation-lifecycle-spec.md` |

---

## 14. 4B-4K generation registry PoC（追記）

| 項目 | 状態 |
| --- | --- |
| independent registry | PoC PASS（unit） |
| manifest+registry resolve | developer-only |
| 証拠 | `docs/hybrid/HYBRID_PHASE_4B4K_GENERATION_REGISTRY_POC.md` |

