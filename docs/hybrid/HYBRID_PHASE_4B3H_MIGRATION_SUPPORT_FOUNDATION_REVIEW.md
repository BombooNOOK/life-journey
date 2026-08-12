# Hybrid Phase 4B-3H｜Migration Support Foundation Extraction Review

**Base main:** `252d818c7705e14d34f3faac3e63e3a087d2e08a`  
**3G reference:** `refactor/local-journal-encryption-migration-hardening` @ `d89d986`  
**Branch:** `refactor/local-first-migration-support-foundation`  
**main merge:** forbidden this phase

3G を wholesale merge / rebase / cherry-pick していない。必要な Foundation だけ手作業移植。

---

## 1. 3F/3G が証明したこと

- fixture だけで plaintext → encrypted staging → verify → promote が成立
- 失敗時も source を残せる
- sidecar 込み cleanup と iOS 実空き容量 API が動く
- **それでも** actual `ljd_local_journal` migration と engine の main 化は禁止のまま

---

## 2. 差分分類 A〜D

### A｜今すぐ Foundation へ入れる価値がある（今回移植）

- iOS `volumeAvailableCapacityForImportantUsage`（fallback `volumeAvailableCapacity`）
- `StorageCapacityProvider` / `readStorageCapacity`
- `availableBytes` 型と `decideCapacityKnown`（unknown → fail-closed）
- no-secret logging の値 redact 改善
- sqlite artifact の **read-only** 列挙（name / size / generic role）

### B｜将来有用だが migration engine 側に残す

- `LocalJournalEncryptionMigrator`
- phase state / resume / rollback
- staging → verify → promote
- migration fingerprint
- source×3 / 1MiB PoC reserve / **64MiB production 推奨（未確定）**

### C｜fixture / PoC 専用（残置）

- fixture DB names
- H1〜H9 / M1〜M9 runner
- 人工 capacity injection
- fixture cleanup UI
- dummy 日本語エントリ

### D｜削除能力（今回 main に入れない）

- allowlisted DB delete
- FileManager unlink
- sidecar deletion
- connection registry cleanup

**理由:** ファイル削除は強い副作用。production で共通基盤として必要になるまで 3G branch に残す。Foundation は read-only inspection まで。

---

## 3. capacity API と policy の分離

| 層 | 持つもの | 持たないもの |
| --- | --- | --- |
| Foundation `StorageCapacityProvider` | 空き容量の取得、unknown fail-closed | source×3、reserve、requiredBytes |
| Migration policy（3G branch） | estimate / reserve / required | iOS URLResourceValues 直書き |

64MiB は製品確定値ではない。

Domain/UI は iOS API を直接呼ばない。Android は同じ plugin method を後で差替。

明示呼出まで副作用なし。Web / Journal / Neon / Blob / 森ログ / album / どんぐり / native 一般利用は変更しない。

---

## 4. Strategy A / B（actual DB・未実施）

現状: schema v1、0件、実データなし。

| | A: 空 plaintext を暗号化 migration | B: encrypted fresh bootstrap |
| --- | --- | --- |
| 実益 | 小さい（移す行がない） | 最初から正式構成 |
| Server 原本 | 残せる | 残したまま検証しやすい |
| 余分な production step | plaintext→encrypted が残る | 減らせる |

**第一候補: Strategy B。** この Phase では作成・切替しない。

---

## 5. migration engine の位置づけ

削除しない。

将来の Local schema / encryption 変更 / recovery / old Local→new Local の **PoC / reference implementation** として  
`refactor/local-journal-encryption-migration-hardening` と 3F/3G docs/tests に保存。

---

## 6. Release Gates

RG-1 lock / RG-2 backup中身 / RG-3 restore / RG-4 Quick Start は **未完のまま**。
