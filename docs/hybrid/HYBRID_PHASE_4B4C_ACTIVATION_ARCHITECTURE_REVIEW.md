# Hybrid Phase 4B-4C｜Encrypted Local Journal Activation Architecture Review

**Base branch / commit:** `feat/server-to-encrypted-local-multi-copy` @ `13ab0cb6cba378b4853ec60607b319ba95990657`  
**This branch:** `docs/local-journal-activation-architecture`  
**Formal main (unmerged):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**SoT candidate:** `docs/product/ljd-local-journal-activation-spec.md`  
**Scope:** docs only — no pointer impl, rename, Repository switch, media move, builds

---

## 1. なぜ今 activation 設計か

4B-4A/4B で、encrypted candidate への fresh bootstrap と Server GET 明示 multi-copy は成立した。  
次の危険な一歩は「そのまま rename して本番名にする」こと。  
その前に **technical activation** の型を決める。

まだ:

- Server = 原本  
- encrypted candidate = 非 active copy  
- actual `ljd_local_journal` = plaintext / 0 / active 接続先  

---

## 2. Strategy A〜D（要約）

| Strategy | 要約 | 判定 |
| --- | --- | --- |
| **A rename** | candidate → `ljd_local_journal` へ改名 | **不採用（初期）** — plaintext 衝突・rollback弱・sidecar/connection |
| **B pointer** | metadata が active DB を指す | **第一候補の核** |
| **C generation id** | `g1`/`g2` 等 + pointer（schema と分離） | **B の推奨具体形** |
| **D その他** | symlink / dual-open / in-place encrypt / code flag | 不採用または非第一 |

詳細表は SoT §2。

**推奨:** Strategy **B+C** — generation 単位の DB/media + Application Support manifest pointer。  
現行 `ljd_local_journal_secure_candidate` は **rename せず** generation id として参照。

---

## 3. Pointer storage

| 候補 | 判定 |
| --- | --- |
| localStorage | 正式候補にしない |
| Preferences | キャッシュ可。真実にしない |
| Keychain | 秘密用。pointer 第一にしない |
| 別 SQLite metadata | 有力だが管理増 |
| **AS small manifest** | **第一候補** — atomic rename、checksum、backup/moving、Android 置換 |

---

## 4. Manifest / atomicity / crash

- manifest: formatVersion, activeDatabaseId, previousDatabaseId, activationState, generation, schemaVersion, mediaRootId, timestamps, checksum  
- **secret 禁止**  
- write: temp → fsync → atomic rename  
- corrupt: fail-closed（黙って plaintext を開かない）  
- verifying 失敗: previous へ rollback。destructive auto-repair 禁止  

---

## 5. Preflight / rollback retention

Preflight: encrypted, schema, counts, legacyServerId, hashes, media SHA, capacity, Complete, backup include, keychain present, no dupes, no unresolved source_changed, mediaRoot 一致。

Old DB: **即削除禁止**。並行検証期間＋（原本切替前は）RG-2/3 まで previous 保持が強い候補。  
empty plaintext は legacy として残す（削除・rename しない）。

---

## 6. Media

| 案 | 判定 |
| --- | --- |
| A candidate path のまま正式 | 短期 OK |
| B activation 時に大量移動 | 避ける |
| C generation media root | 中期正規形 |

**推奨:** DB と media を同一 generation。activation で大量 rename/copy しない。

---

## 7. Server / 原本 / RG / moving

- activation ≠ Local原本化。当面 Server 原本維持・parallel verification。  
- **次Phase課題:** activation 後の新規あしあと write 先（Server / Local / dual）。  
- RG-1〜4 未完。本Phaseで PASS にしない。原本切替前は RG-2/3 重要。  
- お引越し便初期候補: **active generation のみ正式**。previous は端末内保険。

---

## 8. 追加件数 PoC

今は増やさない。generation/media 方針確定後に、**同じ generation へ明示 ID 5〜10件**を検討。

---

## 9. 実施していないこと

pointer 実装、rename、Repository 切替、actual DB/media 変更、Local/Server write 変更、原本化、RG 変更、main merge、native/Next/Simulator build。

---

## 10. 判定メモ（報告用）

| 問い | 判定 |
| --- | --- |
| pointer/generation を第一候補にしてよいか | **A** |
| 次に activation 実装 PoC へ進めるか | **B（条件付き）** — write 先方針の短い比較が先か同時 |
| その前に追加 multi-copy すべきか | **B** — 必須ではない。方針確定後でよい |
| main 統合 | **B** |
| 次Phase推奨 | write-target 比較メモ →（任意）同 generation 明示5〜10件 → activation PoC（Group A） |
