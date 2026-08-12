/**
 * Phase 4B-3F — Plaintext Local Journal → Encrypted Local Journal Migration PoC
 *
 * Branch: feat/local-journal-encryption-migration
 * Base: origin/main 252d818c7705e14d34f3faac3e63e3a087d2e08a
 * Baseline: baseline/local-first-security-foundation-2026-08-12
 *
 * main merge: forbidden this phase
 */

# Hybrid Phase 4B-3F｜Local Journal Encryption Migration PoC

**Labels:** **Verified** / **Designed** / **Release Gate（未完のまま）**

---

## 1. 目的

正式 schema を壊さず・重複させず・元へ戻せる形で、plaintext → encrypted を **fixture DB だけで**実証する。

`ljd_local_journal` は暗号化・rename・削除しない。本物あしあとは使わない。

---

## 2. actual ljd_local_journal audit（Simulator）

計測: Simulator iPhone 17 / Application Support

| 項目 | 値 |
| --- | --- |
| location | `Library/Application Support/app.bamboonook.ljd/ljd_local_journalSQLite.db` |
| header | `SQLite format 3`（plaintext） |
| size | 49152 |
| user_version | 1 |
| tables | local_journal_entries / local_journal_tags / local_media |
| row counts | 0 / 0 / 0 |
| looksLikeRealUserData | **false** |

会社用 SE: 同pathの journal ファイルは取得できず（未作成）。**そのDBは migration source に使わない。**

---

## 3. fixture schema

DB names:

- source: `ljd_enc_mig_fixture_plain`
- staging: `ljd_enc_mig_fixture_staging`
- promoted: `ljd_enc_mig_fixture_promoted`

正式と同じ `LOCAL_JOURNAL_SCHEMA_SQL` / `user_version=1`。  
fixture 行は `LJD_ENC_MIG_FIXTURE_` prefix。日本語本文・空tag・複数tag・legacyServerId あり/なし・media relative path。

---

## 4. architecture（Designed）

```
plaintext source
  → encrypted staging (SQLCipher / plugin Keychain)
  → verify fingerprints
  → encrypted promoted
source は常に残す
```

in-place encryption は採用しない。

鍵経路（4B-3E）: `setEncryptionSecret`（未設定時のみ）→ 既存なら plugin Keychain 再利用 → `mode:"secret"`。  
passphrase はメモリのみ。state JSON / report / log に出さない。

接続衝突回避のため、fixture PoC は source を fingerprint/read 後に close してから encrypted staging へ書く。本文は log しない。

---

## 5. verification

hash 比較（本文非log）:

- table 一覧（expected 3 + 余剰tableは abort）
- PRAGMA table_info 列名（schema inventory）
- row count / table
- stableId / legacyServerId / dateKey
- content SHA-256
- tags
- media metadata（relative path 等）
- PRAGMA user_version

media 本体は copy しない。参照先の存在確認のみ。

---

## 6. rollback / kill / idempotency

| 失敗 | 扱い |
| --- | --- |
| staging 作成 / SQLCipher open / copy / verify / promote / kill / disk | source 削除禁止。staging/promoted は捨てて `failed` |
| app kill | 次回起動で自動再開しない。developer が `resume:true` または rollback |
| 2回目 | `phase=promoted` なら no-op（duplicate なし） |

状態: `not_started | staging | verified | promoted | failed`  
保存: `Library/ljd/security-poc/enc-mig-state.json`

---

## 7. disk-space guard

概算: `max(256KiB, sourceBytes * 3)`。  
available が分かるとき不足なら中止。不明なら estimate を記録して続行（実エラーは catch）。

---

## 8. old plaintext retention（production 候補）

promote 直後の即削除はしない。

| 案 | 判定 |
| --- | --- |
| temporary rollback copy（source を残す） | **第一候補** |
| short retention 後削除 | reopen 成功確認後 |
| 成功 reopen 後削除 | 将来 production の最終段 |

4B-3F は fixture source を削除しない。

---

## 9. limitations / Release Gates

- 本物 `ljd_local_journal` 未切替
- 一般ユーザー自動 migration 禁止
- RG-1 lock / RG-2 backup中身 / RG-3 restore / RG-4 Quick Start は **未完のまま**

---

## 10. Simulator M1–M9（Verified）

iPhone 17 Simulator / developer diagnostics（本番 journal 未切替）

| Step | 結果 |
| --- | --- |
| M1 plaintext fixture | PASS entries=3 tags=5 media=2 |
| M2–M5 staging→verify→promote | PASS encrypted promoted |
| M6 close / kill+relaunch | PASS（再起動後も promoted のまま） |
| M7 encrypted reopen | PASS encryptedFlag=true |
| M8 wrong key | PASS plaintext open 拒否 + checkEncryptionSecret(wrong)=false |
| M9 re-run | PASS already migrated no-op |

既存 plugin Keychain secret を再利用（secret 増殖なし）。

既知の隙間: 失敗後に残った `ljd_enc_mig_fixture_staging` ファイルが promote 後もディスクに残ることがある（増殖はしない）。production では FileManager unlink を追加する。

## 11. Web / Server

変更なし。Neon / Blob / あしあと原本はそのまま。

## 12. Release Gates

RG-1 lock / RG-2 backup中身 / RG-3 restore / RG-4 Quick Start は **未完のまま**。

## 13. 判定

- migration engine を正式基盤候補にするか: **A（fixture 成立。staging 残骸削除と実機 free-space は次）**
- actual `ljd_local_journal` 明示 migration へ進めるか: **B（まだ禁止）**

次Phase候補: staging file 確実削除 + iOS 空き容量 API + なお本番 journal は触らない。RG-1 は別線。
