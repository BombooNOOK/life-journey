# Hybrid Phase 4B-4A｜Fresh Encrypted Local Journal Bootstrap

**Base:** origin/main `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**Baseline:** `baseline/local-first-migration-support-foundation-2026-08-12`  
**Branch:** `feat/fresh-encrypted-local-journal-bootstrap`  
**main merge:** forbidden this phase

---

## 1. なぜ今 plaintext migration を採らないか

actual `ljd_local_journal` は schema v1・0件・実データなし。空 DB を in-place 暗号化しても実益が小さく、失敗時の破壊面だけが増える。

**第一候補:** 別名の encrypted candidate を fresh bootstrap し、Server 原本は残したまま次 Phase で copy 先として使う。

3F/3G migration engine は将来の schema/encryption/recovery 用 reference として feature branch に残す。今回は使わない。production migration は禁止。

---

## 2. DB naming

採用: `ljd_local_journal_secure_candidate`

| 候補 | 評価 |
| --- | --- |
| `ljd_local_journal_secure_candidate` | **採用。** journal 系列・非 active・暗号化が名前で分かる。schema version を含まない |
| `ljd_local_journal_v2` | NG。schema `user_version` と混同する |
| `ljd_local_journal_enc` | active 昇格時に「これが本番」と誤読しやすい |
| `ljd_enc_mig_fixture_*` | PoC fixture に見える。不採用 |

storage generation（encrypted candidate）と `PRAGMA user_version`（schema=1）は別物。この Phase では active 名へ昇格しない。

---

## 3. architecture

`LocalJournalSecureBootstrapper`（明示呼出のみ。一般 app startup からは呼ばない）

```
capacity known?
  → existing candidate health
     missing → create encrypted DB from official schema
     ready → already_ready（削除も上書きもしない）
     abnormal → fail-closed（自動修復しない）
```

役割は **新規 encrypted Local Journal candidate の初期化・検証だけ**。

---

## 4. encryption

正式 Security Foundation:

1. `ensurePluginEncryptionSecret`（既存 secret があれば再利用、無ければ `setEncryptionSecret`）
2. Capacitor SQLite built-in Keychain
3. `kSecAttrAccessibleWhenUnlocked`
4. SQLCipher
5. `mode:"secret"`

secret は log / source / state JSON / diagnostics に出さない。  
Simulator 初回 bootstrap は `pluginKeychain=reused_existing`（Foundation 既存 secret を再利用）。増殖なし。

---

## 5. schema

plaintext DB を schema source として copy しない。正式 definition `LOCAL_JOURNAL_SCHEMA_SQL` から作成。

- `local_journal_entries`
- `local_journal_tags`
- `local_media`
- `PRAGMA user_version = 1`

初期 rows: entries=0 / tags=0 / media=0。dummy user content なし。  
schema test fixture は unit test 側のみ。

---

## 6. storage / backup / File Protection

- 場所: Foundation `resolveLjdApplicationSupportDir()`（Application Support / LJD 専用領域）。絶対 path hardcode なし
- backup: 作成後に `isExcludedFromBackup` を inspect。`true` のときだけ `false` へ
- File Protection: `NSFileProtectionComplete` を creation 後に適用
- RG-1「lock中アクセス拒否」は未完のまま

---

## 7. capacity

正式 `StorageCapacityProvider` / `decideCapacityKnown`。  
capacity unknown なら production 候補 bootstrap を開始しない（fail-closed）。  
`SECURE_BOOTSTRAP_MIN_AVAILABLE_BYTES = 256KiB` は空 DB 作成の PoC floor。製品確定 reserve ではない。  
fixture/test のみ override 可。

---

## 8. idempotency / abnormal candidate

同じ bootstrap を 2 回実行しても:

- DB 増殖なし
- Keychain secret 増殖なし
- schema 二重作成なし
- candidate 削除なし
- row 変更なし

既存 candidate が正常なら `already_ready`。

同名 candidate が plaintext / schema mismatch / encryption 判定不能 / `user_version` 不一致 / expected table 欠損の場合は **勝手に修復・削除・上書きしない**。fail-closed して developer 確認待ち。失敗 candidate の自動削除 helper は追加しない。

---

## 9. 分離（最重要）

- Repository / Journal UI / Web / Neon / 森ログ は引き続き `ljd_local_journal`
- candidate を通常 Repository に接続しない
- activation pointer / rename / 旧 DB 削除 / fallback は未実装
- Server→Local copy / Journal API fetch / bulk migration / photo download なし
- Server 原本は無関係。Local 原本化なし

---

## 10. diagnostics

development-only（capacitor-www Storage Lab）。read-only inspect + 今回のみ明示 bootstrap ボタン。

条件: actual `ljd_local_journal` を対象にしない / production 404 / secret 非表示 / destructive cleanup なし。

---

## 11. Release Gates

RG-1〜4（lock 拒否 / backup 中身 / restore / Quick Start）は **未完のまま**。  
Fresh Bootstrap 成功で変更しない。実機専用項目を新たに PASS 扱いしない。

---

## 12. Simulator B1–B9（iPhone 16e / iOS 18.5 相当）

| Step | 結果 | 証拠 |
| --- | --- | --- |
| B1 candidate 不存在 → bootstrap | **PASS** | 初回 `exists=false health=missing` → `created` `keychain=reused_existing` |
| B2 encrypted | **PASS** | `encrypted=true` / header は SQLite format 3 ではない |
| B3 schema / rows | **PASS** | `user_version=1` tables=`entries,tags,media` rows=0/0/0 |
| B4 backup inclusion | **PASS** | `isExcludedFromBackup=false` |
| B5 Complete | **PASS** | `protection=NSFileProtectionComplete` |
| B6 close/reopen | **PASS** | encrypted candidate を close 後 reopen |
| B7 kill/relaunch | **PASS** | `simctl terminate` + launch 後も Complete / encrypted / rows=0 |
| B8 二回目 bootstrap | **PASS** | `already_ready` / candidate 非削除 |
| B9 actual plaintext 無変更 | **PASS** | `ljd_local_journalSQLite.db` は SQLite format 3 / `user_version=1` / rows 0/0/0 / `prodEncrypted=false` / 49152 bytes 維持 |

成功 candidate は次 Phase の Server→Local copy 先として残置。自動削除しない。

secret leak scan（report JSON）: passphrase / long hex / `secret:` なし。

---

## 13. 禁止（実施していない）

- actual `ljd_local_journal` の delete / rename / encrypt / schema 変更 / repository 接続先変更
- plaintext→encrypted production migration
- activation / Local 原本化
- Server 接続
- RG 変更
- main merge
