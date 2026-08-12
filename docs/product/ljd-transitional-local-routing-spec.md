/**
 * Life Journey Diary｜Server-authoritative Transitional Local Routing
 *
 * Status: Pre-Implementation Server-authoritative Transitional Routing / Source of Truth Candidate
 * Updated: 2026-08-12
 * Branch: docs/production-transitional-local-routing
 * Base: feat/local-generation-resolver-integration-poc @ 6247f3f
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: design only. No production wiring, pending queue impl, build, Simulator, main merge.
 *
 * 親方針:
 * - docs/product/ljd-product-worldview-source-of-truth.md
 * - docs/product/ljd-local-first-and-moving-policy.md
 * - docs/product/ljd-local-journal-activation-spec.md
 * - docs/product/ljd-local-journal-write-routing-spec.md
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4H_PRODUCTION_ROUTING_ARCHITECTURE.md
 * - docs/product/ljd-local-mirror-outbox-spec.md（4B-4I outbox PoC）
 * - docs/product/ljd-local-generation-lifecycle-spec.md（4B-4J generation lifecycle）
 */

# Life Journey Diary｜Server-authoritative Transitional Local Routing

**Status:** Pre-Implementation Server-authoritative Transitional Routing / Source of Truth Candidate  
**ラベル:** **Designed candidate**＝移行期間の第一候補／**Open**＝未確定／**Forbidden now**＝本Phase実装禁止／**Release Gate**＝未実証（PASS禁止）

**実証済み前提（4B-4A〜4G）:** encrypted generation / multi-copy / write-through mirror / activation manifest / generation resolver / fail-closed / actual DB・一般UI無変更。

**現在:** Server = Source of Truth。Local generation = mirror / technical candidate。RG-1〜4 未完。

---

## 0. 三段階の分離（維持）

| 段階 | 今回 |
| --- | --- |
| Technical activation | 済み（developer PoC） |
| **Transitional write routing（本SoT）** | **設計のみ** |
| Read routing（Local-only UI） | **別Phase** |
| Local Source-of-Truth switch | **別 Gate** |

---

## 1. 現 production save flow（コード監査・変更なし）

主経路は伴走保存 UI → `POST /api/journal`（`CompanionWritingPage.saveEntry`）。

### 1.1 概念順

1. **UI submit** — 確認後 `saveEntry()`（バリデーション・2000字・書込可否）
2. **Client request** — `POST /api/journal`（content / mood / activity / companion / entryDate / profileId）
3. **Server 認証・入力検証** — empty / mood / photo / entryDate 等
4. **どんぐり事前残高確認** — 不足なら **402**（DB create 前）
5. **生成コメント** — `buildJournalGeneratedComment`
6. **Journal create** — `prisma.journalEntry.create` → **cuid 発行**
7. **写真** — 必要なら Blob 解決後 `journalEntry.update`（同一 entry）
8. **下書き写真移譲** — 条件付き
9. **どんぐり settlement** — `chargeDiarySaveAcorns({ journalEntryId })`  
   - 不足時: **entry delete** → 402（この時点では正式保存不成立）  
   - 成功 / alreadyCharged: 残高更新
10. **下書き削除** — `deleteJournalDraft`
11. **HTTP 200** — `{ entry, donguriBalance, code: "OK" }`
12. **Client success** — `res.ok` かつ `data.entry.id` を確認 → カレンダーへ `window.location.assign`
13. **Error** — 非 OK はユーザーへ失敗表示。ACORN_INSUFFICIENT は下書き誘導

編集は別経路（例: `PATCH /api/journal/[id]`）。Update mirror は本SoTでは **別Phase**（§12）。

### 1.2 「Serverで保存が確定した」地点

| 地点 | 評価 |
| --- | --- |
| `prisma.journalEntry.create` 直後 | **不十分。** その後のどんぐり不足で entry が delete され得る |
| 写真 update 完了直後 | まだ charge 前 |
| **`chargeDiarySaveAcorns` 成功（または alreadyCharged）後** | Server 側の製品的確定に近い |
| **Client が `res.ok && data.entry?.id`（`code: "OK"`）を受け取った時点** | **クライアント側の正式成功判定。** transitional mirror 挿入の第一基準 |

**第一候補の「canonical 確定」:**  
HTTP 成功応答に含まれる **Server entry id（cuid）** がクライアントに返り、`OK` と解釈できること。  
その後の mirror は **GET `/api/journal/[id]` で再取得した canonical** を使う（UI 下書き値の別 write 禁止 — 4B-4E 方針）。

---

## 2. Mirror 挿入候補

| Strategy | 内容 | 判定 |
| --- | --- | --- |
| **A** UI から直接 mirror | component に Local 責務 | **非推奨** |
| **B** Server save 完了後の **client application service** | orchestration 層 | **第一候補** |
| **C** Server API 内部から native Local | Server は端末 storage に書けない | **不成立** |
| **D** navigation 先で後追い | UX・紛失・二重実行リスク | 補助可・主経路にしない |

### 2.1 推奨 orchestration（概念）

```text
saveJournalToServer()          // 既存 POST /api/journal 相当
  → success (entryId)
  → resolveTechnicalActiveLocalJournal() / ResolvedLocalJournalGeneration
  → mirrorServerJournalEntryToLocalGeneration(entryId, target)
```

- 既存 UI component に詰め込まない。  
- **Save orchestration layer**（application service）を挟む。  
- production 配線は別 PoC。本Phaseは設計のみ。

---

## 3. Server / Local 成功失敗 matrix

| Server | Local mirror | 扱い |
| --- | --- | --- |
| 失敗 | — | 保存失敗。mirror しない |
| 成功 | 成功 | 通常成功 |
| 成功 | 失敗 | **Server 成功を維持。rollback しない。** Local は retry / pending |

どんぐりは Server 側 settlement 済み。mirror 失敗で再課金・二重消費しない（§15）。

---

## 4. UX（Server OK / Local NG）

| 案 | 評価 |
| --- | --- |
| A 保存失敗表示 | **不適切**（原本は Server 成功） |
| **B 通常成功＋裏側 retry** | **初期第一候補** |
| C 「端末への保存をあとで再確認」明示 | 将来候補（コピー要設計） |
| D 無表示 pending | B に近いが observability 弱 |

初期: ユーザーには **Server 保存成功**として扱い、Local 失敗は **内部 retry 対象**。  
retry 機構未実装期間は pending を **durable に保持**する設計が必要（§5）。実装は本Phase禁止。

---

## 5. Mirror pending 正式モデル（設計）

### 5.1 保存場所比較

| 案 | 評価 |
| --- | --- |
| **A Local generation 内 status table** | generation と同居。削除・切替と運命共同体 | 有力 |
| **B 独立小 metadata SQLite** | generation 横断 queue。実装増 | **第一候補寄り** |
| C activation manifest に混ぜる | pointer と業務 queue 混在 | **第一にしない** |
| D Preferences | 容量・破損・backup 弱い | 補助のみ |

**第一候補:** **B（独立小 metadata DB / outbox）** — activation manifest を汚さない。  
A は「active generation 専用 outbox」としても可（Open）。

### 5.2 pending に載せてよい情報（最小）

- `serverEntryId`（cuid）
- `targetGenerationId`（opaque / ULID 推奨 — §22）
- `requestedAt`
- `retryCount`
- `lastResult`（needsRetry / failed / source_changed 等）
- `lastAttemptAt`

**載せない:** 本文・写真 bytes・secret / passphrase / cookie。

retry 時は **Server canonical GET** を再実行（4B-4E）。

### 5.3 消すタイミング

- `mirrored` / `already_present` 成功 → pending 削除（または completed 印）
- `source_changed` → pending 残し **人手 / 別 policy**（自動 overwrite 禁止）
- generation retire 時 → lifecycle 明示処理（§7）

---

## 6. Retry semantics

| タイミング | 初期評価 |
| --- | --- |
| 次回 app 起動（foreground） | **第一候補に含める** |
| Journal / diagnostics 表示時 | 可 |
| network 復帰 | 可（過剰連打注意） |
| 手動 developer retry | PoC / internal 必須 |
| background task | **導入しない（当面）** |

**第一候補:** foreground の安全なタイミングに限定。background sync 禁止。

---

## 7. Generation 変更との関係

pending 作成時 generation A。retry 時に active が B の場合:

| 案 | 評価 |
| --- | --- |
| **A 作成時 A へ固定 retry** | **第一候補。** silent retarget なし |
| B 現在 active B へ | 危険（意図しない世代へ） |
| C 停止して migration 判断 | A の失敗時エスカレーション |

generation lifecycle（retire / package）が A の pending を明示処理する。

---

## 8. source_changed

retry 時 Server fingerprint が変わった場合:

- 既存方針: **`source_changed`・自動 overwrite 禁止**
- pending は残し、別 policy「latest canonical mirror」は **Open / 将来**
- Update mirror Phase と合わせて設計

---

## 9. Create / Update / Delete の分離

| 操作 | 今回 |
| --- | --- |
| **Create mirror** | transitional routing の主対象（4B-4E 実証と連続） |
| **Update mirror** | **未設計・別Phase**（Local 既存行の上書き policy 必須） |
| **Delete propagation** | **設計対象外。** Local原本化前の Release Gate 候補 |

Create と Update を同一仕様にしない。

---

## 10. Offline 整合

Server-authoritative 期間:

- network なし → Server save 不成立 → **final あしあと不可**
- 既存 Local-first: offline は **Local draft** まで（`/api/journal/drafts` 等）
- **offline final save は導入しない**

---

## 11. どんぐり

- settlement は **Server API 内**（`chargeDiarySaveAcorns`、`relatedDiaryId` で二重防止）
- Local mirror は **課金 transaction ではない**
- mirror failure / retry で **再課金しない**
- charge 失敗時 Server は entry を消す → mirror 対象にならない

---

## 12. Media

Server canonical photo → GET → SHA-256 → generation media root。  
retry は hash / already_present / partial rollback（4B-4E）。二重保存防止。

---

## 13. Read routing との分離

- 一般 Journal UI は **当面 Server read 維持**
- write-through を将来配線しても **同時に Local-only read しない**
- write routing と read routing は **別Phase**

---

## 14. Source-of-Truth switch 前 Gate 候補（RG-1〜4 定義は不変）

Local を正式原本にする前に最低限:

| 候補 | ねらい |
| --- | --- |
| RG-1 lock protection | 端末保護属性 |
| RG-2 backup content | バックアップ中身 |
| RG-3 restore | 復元後 open |
| offline write | 通信断時の権威 |
| Local create / update / delete | 手元 CRUD |
| conflict resolution | 多端末・再 mirror |
| recovery | 破損 fail-closed |
| moving package | お引越し便 |
| delete propagation | Server/Local 削除整合 |

**RG-1〜4 の PASS 状態は本Phaseで変更しない。**

---

## 15. Rollback（配線後の必須条件）

production write-through 配線後に問題があれば:

- **feature / routing を無効化** → 従来 **Server-only** に戻せる
- Local mirror データは **削除しない**（捨てない）
- pending queue は freeze / drain 方針を別途（Open）

---

## 16. Rollout

| 段階 | 評価 |
| --- | --- |
| developer only | **現在〜次 PoC** |
| internal test account | 次 |
| small cohort / opt-in | その後 |
| full rollout | Gate 後 |

いきなり全ユーザー有効化しない。

---

## 17. Observability（本文・写真なし）

監視候補: `mirror_attempted` / `mirrored` / `already_present` / `needsRetry` / `source_changed` / `failed` / latency / `generationId`。  
secret・本文・email をログしない。

---

## 18. Generation ID 方針

- DB ファイル rename は不要（4B-4G 継続）
- production orchestration では **opaque `generationId`（ULID 等）** を推奨
- ユーザー向けに「g1/g2」を露出しない
- `databaseId` / `mediaRootId` は内部技術 id

---

## 19. 追加 multi-copy

今回不要。routing / pending モデル確定後の負荷 PoC の方が価値が高い。

---

## 20. 禁止（本Phase＝4B-4H 設計時）

production save 配線、pending queue 実装、background retry、Local read 切替、Local update/delete、feature flag 実装、build / Simulator、main merge。

**追記（4B-4I）:** 独立 outbox PoC は `docs/product/ljd-local-mirror-outbox-spec.md` ／  
`docs/hybrid/HYBRID_PHASE_4B4I_LOCAL_MIRROR_OUTBOX_POC.md`。production save 配線は引き続き禁止。

---

## 21. 矛盾時の優先

世界観 → Local-first 方針 → お引越し便 → activation SoT → write-routing SoT → **本 transitional routing SoT（候補）** → Hybrid メモ → コード。


---

## 22. 4B-4J 追記

generation lifecycle 設計: `docs/product/ljd-local-generation-lifecycle-spec.md` ／  
`docs/hybrid/HYBRID_PHASE_4B4J_GENERATION_LIFECYCLE_ARCHITECTURE.md`。  
pending pin / retirement_blocked / independent registry は本 transitional routing と整合。
