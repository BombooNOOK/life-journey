/**
 * Phase 4B-3E — Local-first Security Foundation Cleanup & Mainization Preparation
 *
 * Branch: refactor/local-first-security-foundation
 * Base: origin/main 1a8a8b1057bd98c0ceea6e64ec97f6d74e514c41
 * PoC source (not wholesale-merged): test/ios-local-first-backup-restore @ 2519e23
 *
 * main merge: not in this phase
 */

# Hybrid Phase 4B-3E｜Security Foundation

**Status:** Security Foundation transplant (no user-behavior change)  
**Labels:** **Verified**＝Simulator/実機で確認済み／**Designed**＝仕様として採用／**Release Gate**＝未実証（PASSにしない）

---

## 1. 目的

PoC branch（4B-3B〜3D）を main へ丸ごと merge しない。  
実証できた production 候補だけを、明示呼び出しの Security Foundation として整理する。

一般ユーザーの Web あしあと / Neon / Blob / 森ログ / album / どんぐりは不変。  
native でも人生記録の自動 Local 原本化・自動暗号化はしない。

---

## 2. A〜E 分類

| 類 | 内容 | 今回 |
| --- | --- | --- |
| **A** 正式 Foundation | SQLCipher 能力、plugin built-in secret 経路、Application Support 解決、backup inclusion、File Protection、media helper、slim native bridge | 移植 |
| **B** 整理して残す | path inspect、Keychain accessibility 検査（secret非読）、error types、no-secret log | 移植 |
| **C** PoC専用・削除 | dummy DB/text/image、Group A / lock / persistence UI、autorun、独自 SecureKeyStore、deletePath、lock probe、PoC runners | **入れない** |
| **D** tests/docs | 4B-3B〜3D docs + 実機 JSON、unit tests（native拒否は mock PASS にしない） | 残す／新規 |
| **E** Release Gate | lock中拒否、backup中身、restore、Quick Start、uninstall、export compliance 最終 | **未実証のまま** |

---

## 3. Verified / Designed / Release Gate

### Verified

- SQLCipher dummy: plaintext→encrypted、wrong key failure、key change（Simulator）
- plugin built-in Keychain item: `service=unlockSecret` / `account=ljd_CapacitorSQLitePlugin` / **`kSecAttrAccessibleWhenUnlocked`**（secret本文未取得）
- Application Support 配置 + encrypted dummy open
- backup exclusion=false（LJD include 明示後、reopen維持）
- `NSFileProtectionComplete` 属性 set + reopen 維持（Simulator + 会社用 SE）
- media OS Data Protection（read / exclude=false）
- kill/relaunch persistence、reboot→unlock→reopen（会社用 SE、dummy only）

### Designed

- DB鍵第一候補: Capacitor SQLite `setEncryptionSecret` → plugin Keychain → SQLCipher `mode:"secret"`
- 正式DB場所候補: Application Support / bundleId（FileManager 実行時解決。絶対path非hardcode）
- backup inclusion: 初回 directory 作成後に inspect、**excluded=true のときだけ** `false` を書く
- File Protection 候補: Complete（DB + life-record media）
- media: iOS Data Protection 中心。独自 media 暗号は追加しない
- 独自 LJD SecureKeyStore: production 用途なし → **削除**（DB鍵に使わない）
- `ljd_local_journal` は当面 `no-encryption`。encrypted helper は同名を拒否する

### Release Gate（PASSにしない）

| ID | 項目 | 現状 |
| --- | --- | --- |
| **RG-1** | 実機 lock 中アクセス拒否 | 試行済・`inconclusive_not_demonstrated` |
| **RG-2** | encrypted OS backup に DB+media が含まれる | 未実施 |
| **RG-3** | restore 後 DB+media+Keychain で SQLCipher open | 禁止／未実施 |
| **RG-4** | Quick Start | 未実施 |
| — | uninstall/reinstall orphan Keychain | 未実施 |
| — | App Store export compliance 最終確認 | 未実施（SQLCipher リンクは継続） |

---

## 4. DB key 経路

```
setEncryptionSecret(passphrase)
  → plugin Keychain (iosKeychainPrefix=ljd)
  → service unlockSecret / account ljd_CapacitorSQLitePlugin
  → createConnection(name, encrypted=true, mode="secret")
```

**再監査:** `@capacitor-community/sqlite` の version 変更時は、accessibility 実装を再計測すること。Source 上 plugin は accessibility を明示 set しない。現行実測は WhenUnlocked。

---

## 5. custom SecureKeyStore

4B-3B の `generateSecret` / `setSecret` / `getSecret` 経路は **production に残さない**。  
同じ native plugin は **storage attribute bridge だけ** に縮小した。

---

## 6. backup inclusion 設計

| タイミング | 判定 |
| --- | --- |
| 初回 directory creation 後 | **推奨（最小）** |
| DB initialization 時 | 同等に安全（ディレクトリが無いと意味がない） |
| 毎 launch | 不要（書き込みが増えるだけ） |

実装: `shouldForceBackupInclusion` は `current === true` のときだけ rewrite。  
4B-3E では一般起動へは未配線。

---

## 7. File Protection の区別（消さない）

- **属性設定 + reopen 維持:** Verified
- **lock 中に読めないこと:** Release Gate（未実証）

Apple 仕様上 Complete はロック後まもなく不可。LJD は実機で拒否を測れていないので「実効確認済み」と書かない。

---

## 8. automatic migration

**存在しない。**  
`openLocalJournalDatabase` は `no-encryption`。  
`openNamedEncryptedDatabase("ljd_local_journal")` は throw。

---

## 9. diagnostics

`/preview/local-storage-diagnostics`: development only / production 404 / 製品メニュー非接続。  
残す UI: journal load/clear + **read-only storage attr inspect**。  
削除: dummy 生成、lock、Group A、security autorun。

---

## 10. main 統合判定（この branch）

**B — PoC依存は除去したが、main へ入れる前にレビュー待ち。**  
コード上 A 条件（一般動線不変・明示呼出まで人生記録へ触れない）は満たす設計。  
本Phaseは **origin/main へ merge しない**。
