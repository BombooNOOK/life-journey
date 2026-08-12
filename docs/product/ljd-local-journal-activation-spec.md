/**
 * Life Journey Diary｜Local Journal Activation Architecture
 *
 * Status: Pre-Implementation Activation Architecture / Source of Truth Candidate
 * Updated: 2026-08-12
 * Evidence base: feat/server-to-encrypted-local-multi-copy @ 13ab0cb
 *   (4B-4A fresh encrypted candidate + 4B-4B Server GET multi-copy)
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: design comparison only. No pointer implementation, rename, Repository
 *        switch, media move, Local原本化, Server deletion, or RG PASS.
 *
 * 親方針:
 * - docs/product/ljd-product-worldview-source-of-truth.md
 * - docs/product/ljd-local-first-and-moving-policy.md
 * - docs/product/ljd-moving-package-spec.md
 * - docs/product/ljd-local-data-security-spec.md
 * - docs/product/ljd-device-storage-and-restore-spec.md
 * - docs/product/ljd-local-journal-write-routing-spec.md（4B-4D: 移行期 write 経路）
 */

# Life Journey Diary｜Local Journal Activation Architecture

**Status:** Pre-Implementation Activation Architecture / Source of Truth Candidate  
**PoC (4B-4F):** developer-only technical activation pointer **PASS**（一般 UI / Repository / SoT 未接続）。  
証拠: `docs/hybrid/HYBRID_PHASE_4B4F_ACTIVATION_POINTER_POC.md`

**ラベル:** **Designed candidate**＝比較後の第一候補／**Open**＝未確定／**Forbidden now**＝製品接続禁止／**Release Gate**＝未実証（PASS禁止）

---

## 0. 定義：activation とは何か（分離必須）

### 0.1 Technical activation（本SoTの主対象 / 4B-4F で developer PoC）

> **Activation manifest** が、encrypted Local Journal generation を  
> 「technical active 候補」として指すこと。

4B-4F: Application Support manifest + preflight + developer resolver を実証。  
**一般 Journal Repository はまだ接続しない**（UI activation ではない）。

### 0.1b UI activation（別・未実施）

> 一般 Journal UI / production Repository が Local technical-active generation を読むこと。

### 0.2 Source-of-truth switch（別Phase / Release Gate）

> 人生記録の正式原本を Server → Device へ変更すること（Local原本化）。

| | Technical activation | UI activation | Source-of-truth switch |
| --- | --- | --- | --- |
| manifest が candidate を指す | 含む（4B-4F） | 前提 | 前提 |
| 一般 Repository が Local を読む | **しない（4B-4F）** | 含む | 前提 |
| Server データ保持 | 必須 | 必須 | 移行完了まで |
| RG-2/3 | 推奨 | 推奨 | **必須ゲート** |
| 本Phase製品接続 | developer-only | **禁止** | **禁止** |

---

## 1. 実証済み前提（4B-4A / 4B-4B）

| 項目 | 状態 |
| --- | --- |
| fresh encrypted candidate | `ljd_local_journal_secure_candidate` |
| schema | v1 / entries・tags・media |
| Server GET multi-copy | 明示3件 PASS |
| counts | entries=3 / tags=4 / media=2 |
| dedupe | `legacyServerId` / stableId 維持 / rerun already_present |
| encryption / attrs | SQLCipher / Complete / backup included |
| actual `ljd_local_journal` | plaintext / 0 rows / **active 接続先のまま・未変更** |
| Server | 原本・GET-only・untouched |
| RG-1〜4 | **未完** |

命名注意：`secure_candidate` は **storage generation 候補名**であり、`PRAGMA user_version`（schema）ではない。

---

## 2. Strategy 比較

### Strategy A｜DB rename

candidate を `ljd_local_journal` 等へ rename し、既存 Repository 名を変えない。

| 観点 | 評価 |
| --- | --- |
| atomicity | 弱い。filesystem rename は瞬時でも、plugin connection・sidecar・旧名衝突と一体ではない |
| rollback | 困難。rename 戻し＋接続再確立が必要。crash 中間状態が読みにくい |
| SQLite / plugin | CapacitorSQLite は DB 名で connection を持つ。rename 後の open し直し・キャッシュ不整合リスク |
| SQLCipher | ファイル実体は維持され得るが、名前前提の診断・allowlist が壊れる |
| filesystem / sidecar | WAL/SHM/journal 等の sidecar も同時扱わないと壊れ得る |
| crash | rename 前後のどちらの名前で「正式」かが曖昧 |
| old plaintext 衝突 | **致命的。** 現行 `ljd_local_journal`（0件でも）と同名衝突。事前 rename/delete が必要になり破壊面が増える |
| 将来 migration | 毎回 rename 地獄。generation 履歴が残らない |

**結論:** 初期 activation の第一候補にしない。特に empty plaintext との衝突と rollback の弱さが却下理由。

### Strategy B｜Active DB Pointer（第一候補として評価）

DB ファイル名は generation として固定し、小さな **activation metadata（pointer / manifest）** が  
Repository の「いま読む generation」を決める。

| 観点 | 評価 |
| --- | --- |
| rollback | 強い。pointer を previous に戻すだけ（DB/media 実体は触らない） |
| generation 切替 | 明示的。candidate → active を「確認してから」切替できる |
| crash safety | pointer の atomic write + checksum + fail-closed で設計可能 |
| old DB 保持 | 自然。plaintext empty / 旧 generation を残せる |
| future schema / encryption migration | staging generation を作り pointer 切替、という同じ型 |
| moving package | active generation を包む設計と整合しやすい |
| Android | Preferences/Keychain 依存を避け、ファイル manifest + adapter で置換しやすい |

**課題:** Repository が「固定 DB 名」前提なら、読取経路が pointer を見る変更が必要（実装は別Phase）。

### Strategy C｜Stable generation identity + pointer

例：`ljd_local_journal_g1`, `ljd_local_journal_g2` …  
pointer が active generation id を指す。

| 観点 | 評価 |
| --- | --- |
| schema vs generation | **混同禁止。** `gN` ≠ `user_version`。manifest に両方を別フィールドで持つ |
| 履歴 | 明確。g1 plaintext empty、g2 encrypted copy、g3 schema v2 … |
| 命名 | `_secure_candidate` より長期向き。PoC 名からの昇格ルールが必要 |
| 実装コスト | B の具体化。本質は pointer + generation |

**結論:** B の推奨具体形。現行 candidate は事実上 **generation g2 候補（仮）** として再ラベル可能（rename せず metadata 上の id で扱う）。

### Strategy D｜その他

| 案 | 評価 |
| --- | --- |
| D1. soft link / alias file | iOS sandbox で脆い。バックアップ・plugin 互換が不明。不採用 |
| D2. always-open-both + merge view | 複雑・競合・性能。activation の代替にしない |
| D3. single DB in-place encrypt of `ljd_local_journal` | 4B-4A で空 DB in-place を採らない判断済み。rollback 弱い |
| D4. Repository hardcode switch flag in code | 端末状態に残らず、機種変更・再インストールで消える。不採用 |

**推奨合成:** **Strategy B + C**  
= **generation-named（または generation-id 付き）DB/media + active pointer manifest**。  
現行 `ljd_local_journal_secure_candidate` は rename せず、manifest 上の `databaseId` / `generation` として参照。

---

## 3. Pointer 保存場所の比較

Pointer は秘密ではないが、**破損・部分書込・古い読取**で別 generation を開くと人生データ事故になる。

| 場所 | atomic write | checksum | fail-closed | backup | moving | Android | 評価 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `localStorage` / WebView storage | 弱い | 自前必要 | 弱い | 不明・機種依存 | 弱い | 別物 | **正式候補にしない** |
| Capacitor Preferences | 中 | 自前 | 可能 | OS依存 | 要設計 | 置換可 | 補助可。単体第一にしない |
| Keychain | OS atomic 寄り | 自前 | 可能 | Keychain バックアップ属性に依存 | ThisDeviceOnly と衝突し得る | 別API | **秘密用。pointer の第一候補にしない**（鍵と混同しやすい） |
| 別 SQLite metadata DB | 強い（SQL tx） | 容易 | 容易 | AS 配置なら include 可 | 包める | 置換可 | 有力。ただし「メタ用 DB」管理が増える |
| **Application Support の small manifest file** | rename-replace で atomic 可 | 必須 | 必須 | AS + include 方針と一致 | ファイルとして包める | 同型ファイルで可 | **第一候補** |

### 3.1 第一候補：Application Support small manifest

- 場所: Foundation の LJD Application Support 配下（絶対 path hardcode 禁止）
- 書込: temp file → fsync → atomic rename
- 内容: JSON（下記）+ `manifestChecksum`（本文のハッシュ。secret なし）
- 読取: checksum / formatVersion 不正 → **fail-closed**（勝手に plaintext へ落とさない）
- backup: DB と同様 **include**（除外しない）
- moving: お引越し便の「端末設定のうち active generation 指示」として含められる（詳細 Open）

Preferences は「高速キャッシュ」に留め、真実は manifest とする案も可（Open）。

---

## 4. Activation manifest 案（概念・未実装）

```text
formatVersion: 1
activeDatabaseId: "ljd_local_journal_secure_candidate"   // or future g2 id
previousDatabaseId: "ljd_local_journal" | null
activationState: "inactive" | "activating" | "active" | "rollback_pending"
generation: 2                    // storage generation — NOT schema
schemaVersion: 1                 // PRAGMA user_version expected
mediaRootId: "journal-secure-candidate"  // generation-aligned
activatedAt: ISO-8601 | null
lastVerifiedAt: ISO-8601 | null
manifestChecksum: hex
```

**禁止:** passphrase / Keychain secret / SQLCipher key / 本文 / Cookie を入れない。

`activationState` により crash 後の解釈を一意化（§6）。

---

## 5. Activation preflight（正式切替前の最低確認）

すべて PASS するまで pointer を `active` にしない。失敗は **停止**（自動修復・削除なし）。

| # | 項目 | ねらい |
| --- | --- | --- |
| P1 | candidate encrypted = true | plaintext 誤昇格防止 |
| P2 | expected tables / columns | schema drift |
| P3 | `user_version` = expected | schema version |
| P4 | Server expected count（明示 ID 集合） | 欠落 |
| P5 | Local expected count 一致 | copy 完了 |
| P6 | 全件 `legacyServerId` 一意・欠損なし | dedupe 基盤 |
| P7 | content hash（Server fingerprint）一致 | 改変・不完全 copy |
| P8 | mediaRefs 完全性 | 参照切れ |
| P9 | media SHA 再読込一致 | 書込破損 |
| P10 | capacity known | fail-closed |
| P11 | File Protection Complete | 属性維持 |
| P12 | backup inclusion | restore 防衛線 |
| P13 | Keychain secret available（値は出さない） | 再開可能性 |
| P14 | duplicate stableId / legacyServerId なし | 整合 |
| P15 | unresolved `source_changed` なし | 黙って上書きしない |
| P16 | mediaRoot が generation と一致 | DB/media ずれ |

並行検証期間中は P4/P7 を定期再実行できるとよい（Open）。

---

## 6. Crash / corrupt pointer / recovery

| 時点 | 期待動作 |
| --- | --- |
| **before pointer write** | old active（現状は plaintext Repository 固定）を維持。candidate は非active のまま |
| **pointer write 途中** | rename-replace 失敗 or checksum 不一致 → **corrupt 検出 → fail-closed**。勝手に candidate／plaintext を選ばない。developer / recovery UI 待ち |
| **after pointer write / before verification** | `activationState=activating`。新 generation を open＋preflight 再実行 |
| **verification failure** | pointer を `previousDatabaseId` へ戻し `rollback_pending` or `inactive`。**silent destructive recovery 禁止**（削除・再暗号・自動 repair なし） |
| **verification success** | `activationState=active`、`lastVerifiedAt` 更新 |

corrupt 時に「とりあえず `ljd_local_journal` を開く」は **禁止**（空でも、誤った世代を正式扱いする事故）。

---

## 7. Rollback window / old DB retention

**原則: activation 直後に old DB / old media を削除しない。**

| 案 | 内容 | 評価 |
| --- | --- | --- |
| R1 即削除 | 切替成功後すぐ old 削除 | **禁止（現段階）** |
| R2 短期保持 | reopen / kill / reboot 確認後 | 最低ライン |
| R3 並行検証期間 | Server 件数・fingerprint 比較が安定するまで | **推奨** |
| R4 RG 完了まで保持 | RG-2/3 等 PASS まで previous 保持 | **source-of-truth 前の強い候補** |

第一候補: **R3 +（source-of-truth 前は）R4 寄り**。  
previous generation は端末内 rollback 保険。お引越し便の正式対象は active のみ（§10）。

現行 empty plaintext `ljd_local_journal` は **legacy empty generation** として残す（削除・rename しない）。activation 後も当面「previous」または「unused legacy」として manifest に記録。

---

## 8. Media activation

現状: DB = `…_secure_candidate`、media = `ljd/media/journal-secure-candidate/`。

| 方式 | 内容 | 評価 |
| --- | --- | --- |
| A. candidate namespace をそのまま正式利用 | path 変更なし | 単純。DB pointer と mediaRootId をセットで active に |
| B. activation 時に正式 namespaceへ移動/copy | 大量 I/O・失敗時 partial | **避けたい** |
| C. generation-based media root | 例: `ljd/media/journal/g2/`。DB generation と 1:1 | 長期の第一候補形 |

**推奨:** **A を短期、C を中期の正規形。**  
いずれも **DB と media を同じ generation 単位**で扱い、activation 時の大量 rename/copy を要求しない。  
相対 path のみ DB 保存・絶対 path 禁止は維持。

---

## 9. Server との関係（activation 後も当面）

- Server copy / Neon データは **残す**（原本）。
- 本設計ではまだやらない: sync、conflict resolution、offline write 製品化、Web read-only 化。

### 次Phase課題（明示）

> Technical activation のあと、**新しいあしあとをどこへ write するか**  
> （Server only / Local only / dual-write / Local-first with Server mirror）  
> が最大の未決。

**4B-4D 回答候補:** 移行期間は **Server-authoritative write-through mirror** を第一候補とする。  
詳細: `docs/product/ljd-local-journal-write-routing-spec.md` ／  
`docs/hybrid/HYBRID_PHASE_4B4D_WRITE_ROUTING_ARCHITECTURE.md`。  
実装・Local-first 最終切替は別 Phase / Gate。

activation 実装より前か同時に方針比較が必要、という 4B-4C 時点の注意は、**write-through を先に確定する順序**として 4B-4D で具体化した。

---

## 10. お引越し便との整合（Open・初期候補）

| 対象 | 初期候補 |
| --- | --- |
| 正式パッケージ内容 | **active generation の DB + media + manifest** |
| previous / rollback generation | **端末内保険**（初期は小包に必須同梱しない） |
| Keychain DB 鍵 | お引越し便鍵と分離（既存 SoT）。pointer は鍵ではない |

未確定: previous を「任意の追加スナップショット」として同梱するか。

---

## 11. Release Gates

RG-1〜4 は **未完のまま。本設計で PASS にしない。**

| Gate | activation との関係 |
| --- | --- |
| RG-1 lock 拒否 | technical activation 後も未完なら「保護属性あり」どまり |
| RG-2 backup 中身 | **source-of-truth 前に重要** |
| RG-3 restore 後 open | **同上** |
| RG-4 Quick Start | 鍵・generation 移住とセットで別検証 |

Technical activation PoC は Group A / dummy に限定。原本切替は RG-2/3 なしで進まない。

---

## 12. 追加 multi-copy のタイミング

- いま 10件 copy はしない。テスト entry の追加作成も求めない。
- **generation / mediaRoot 方針（本SoT）を固めたあと**、同じ generation へ明示 ID で 5〜10件追加 copy を次Phase候補とする。
- activation 実装 PoC の前に件数を増やすかは運用判断（比較レポート参照）。

---

## 13. 禁止（製品接続）

一般 Journal Repository 切替、Local-only read、production Journal save 変更、pointer による write routing、candidate rename、actual DB 変更、media 移動、Local原本化、Server 原本解除、RG PASS 化、main merge。

**4B-4F:** developer-only technical activation pointer PoC は許可（上記製品接続は禁止のまま）。

---

## 14. 矛盾時の優先

世界観 → Local-first 方針 → お引越し便 → 端末保存・復元 → **データ保護 SoT** → **本 activation SoT（候補）** → Hybrid 作業メモ → コード。

---

## 15. 4B-4F 実証メモ

| 項目 | 結果 |
| --- | --- |
| Application Support manifest | PASS |
| atomic write + checksum | PASS |
| preflight / resolve / corrupt / missing / rollback | PASS |
| P1–P12 Simulator | PASS |
| Repository / SoT | 未接続 |