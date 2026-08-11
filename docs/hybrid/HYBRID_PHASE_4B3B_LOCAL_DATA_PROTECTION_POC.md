/**
 * Phase 4B-3B — Local Data Protection PoC
 *
 * Status: Feature-branch PoC results (Simulator iPhone 17 / iOS 26.5)
 * Branch: feat/local-data-protection-poc
 * Parent main: 1a8a8b1057bd98c0ceea6e64ec97f6d74e514c41
 * Dummy data only — no real journals / photos / user PII
 *
 * Related SoT:
 * - docs/product/ljd-local-data-security-spec.md
 * - docs/hybrid/HYBRID_PHASE_4B2D_LOCAL_FIRST_FOUNDATION.md
 */

# Hybrid Phase 4B-3B｜Local Data Protection PoC

## 0. Verdict（要約）

| 判断 | 結果 |
| --- | --- |
| SQLCipher（plugin API・dummy DB） | **PoC success**（encrypt / reopen / wrong key / key change / plaintext→encrypted） |
| Plugin built-in secure store を LJD 正式 SecureKeyStore として採用 | **B（採用しない）** |
| LJD SecureKeyStore bridge | **要**：`kSecAttrAccessibleWhenUnlocked` 明示・取得確認済 |
| SQLCipher を正式採用へ | **A（技術的に前進可）** ※plugin KeychainとLJD鍵の一体化は未解決・本番導入ではない |
| SecureKeyStore 方式を正式へ | **A（WhenUnlocked bridge を第一候補として前進可）** |
| media を OS Data Protection 中心で次へ | **A（段階導入を維持）** ※Complete設定API成功／実ロックは実機follow-up |
| 次に実機 backup/restore へ | **A（進むべき）** |
| 正式DB保存場所の第一候補 | **まだ確定しない**。計測上 Documents は backup に乗りやすい。Library/CapacitorDatabase 親は `isExcludedFromBackup=true`。SQLCipherがあれば backup 上の平文脅威は下がるが、OS復元・お引越し便方針と合わせ **実機backup実測後に確定** |

**最優先原則は維持:** 守るための暗号化によって本人が森へ戻れなくなる設計にしない。device DB key ≠ お引越し便 key。

---

## 1. SQLCipher結果（dummy `ljd_security_poc`）

Package: `@capacitor-community/sqlite@8.1.1`  
Config（PoC）: `iosIsEncryption: true`, `iosKeychainPrefix: "ljd"`, `iosDatabaseLocation: "Library/CapacitorDatabase"`  
本番接続 `ljd_local_journal` は引き続き `no-encryption`。本物DBの暗号migrationは未実施。

| Test | 結果 |
| --- | --- |
| A plaintext dummy | pass |
| B encrypted + plaintext→encrypted (`mode: "encryption"` / plugin `UtilsEncryption` + `sqlcipher_export`) | pass（rows一致・内容一致・encrypted=true） |
| C `isDatabaseEncrypted` | pass |
| D kill/relaunch open | session内 reopen (E) で確認。専用kill後のSQLCipher再openは実機follow-up可 |
| E correct secret reopen | pass |
| F wrong secret (`mode: "wrongsecret"`) | pass（open失敗） |
| G `changeEncryptionSecret` | pass |
| H old rejected / new opens | pass（`checkEncryptionSecret` old=false new=true） |

Secrets: never logged. Report fields only `byteLength` / stored yes-no.

### Failure保持（migration）

Plugin `mode: "encryption"` は rename→temp→`sqlcipher_export`。成功時 temp 削除。意図的failure注入は未実施だが、API失敗時は例外を返し、独自SQLCipher手書きmigrationはしていない。

---

## 2. Plugin built-in secure store 監査

Source: `node_modules/@capacitor-community/sqlite/ios/Plugin/Models/KeychainServices.swift`

| 項目 | 事実 |
| --- | --- |
| API | `SecItemAdd` / `SecItemUpdate` / `SecItemCopyMatching` / `SecItemDelete`（`kSecClassGenericPassword`） |
| `kSecAttrAccessible` | **クエリに未設定** |
| 外部から accessibility 指定 | **不可**（plugin APIなし） |
| service | `"unlockSecret"` |
| backup/migration | accessibility未指定のため **WhenUnlockedを保証できない**。OS既定に依存 |

**Verdict B:** LJD正式 SecureKeyStoreとしては採用確定しない。  
（docsが “secure store” と呼んでも要件充足とはみなさない）

`setEncryptionSecret` / `changeEncryptionSecret` は **フォルダ内DB一覧を走査**する。plaintext UNENCRYPTEDは許容、UNKNOWN等は失敗。SQLCipher用鍵とLJD SecureKeyStoreを無理に一体化していない（Test系A/B分離）。plugin改造・forkなし。

---

## 3. LJD SecureKeyStore PoC

- Package: `plugins/ljd-local-security`（Capacitor SPM）
- Facade: `src/lib/local-first/security/secureKeyStore.ts`（Android差し替え可能な抽象）
- iOS: Security framework、**明示** `kSecAttrAccessibleWhenUnlocked`
- Ops: generate（`SecRandomCopyBytes`）/ set / get / exists / delete
- Domainへ Keychain APIを散らさない

| Test | 結果 |
| --- | --- |
| K1 generate | pass（32 bytes / SecRandomCopyBytes） |
| K2 set | pass（accessibility=WhenUnlocked） |
| K3 get | pass（match + accessibility readback） |
| K4 kill/relaunch | pass（boot時 `priorExists=true`, accessibility=WhenUnlocked） |
| K5 delete | pass |
| K6 get after delete | pass |

---

## 4. DB保存場所比較

| Candidate | Path | `isExcludedFromBackup`（file） | parent | 備考 |
| --- | --- | --- | --- | --- |
| A（現行） | `Library/CapacitorDatabase/*.db` | **false** | **true** | 親ディレクトリは除外。file自身は false（実測） |
| B | `Documents` probe `.db` | **false** | **false** | OSバックアップに乗りやすい |
| C（設計のみ） | `Library/Application Support/ljd` probe | **false** | **false** | 専用bridge管理候補。本格実装なし |

**community docs**の「custom Library locationはbackupされない」は、少なくとも **fileの `isExcludedFromBackup` がtrueという単純話にはならない**（親true・file false）。正式場所は実機iCloud Backup後に再確認してから決める。

---

## 5. media

- Path: `Library/ljd/media/security-poc/dummy.png`（1×1 PNG・dummy）
- backup exclusion: **false**
- default protection: `NSFileProtectionCompleteUntilFirstUserAuthentication`
- write/read + kill経路上のread: pass

---

## 6. File Protection

| Target | 初期 class（実測） | Complete設定後 |
| --- | --- | --- |
| dummy DB | UntilFirstUserAuthentication | **NSFileProtectionComplete**（設定成功） |
| DB parent | unset | — |
| dummy media | UntilFirstUserAuthentication | **NSFileProtectionComplete** |
| media parent | unset | — |

Unlock中 R/W: pass。  
**Simulatorではロック状態での拒否は未実証**（属性設定成功 ≠ 実ロック保護）。

---

## 7. logout / reinstall / backup（公式＋follow-up）

| 事象 | 見通し |
| --- | --- |
| logout | SoTどおり「削除しない／ロック」。Keychain itemは残る想定（製品API未実装） |
| uninstall/reinstall | iOSではKeychainが残ることがある。orphan secret整合が必要（SoT §11） |
| encrypted backup restore | WhenUnlocked itemは暗号化バックアップ経由で移行し得る（Apple）。ThisDeviceOnlyに賭けない |
| Quick Start / 実機backup | **未実施** → 次Phase |

---

## 8. Limitations / risks

1. Plugin内蔵Keychainは accessibility保証不可（B）
2. SQLCipher鍵がplugin Keychainに閉じるため、LJD SecureKeyStoreとの**正式一体化はplugin拡張または自前open経路**が必要（今回forkせず）
3. `iosIsEncryption: true` はAPI解錠のみ。本番暗号展開ではない
4. Candidate Aのbackup属性は「親exclude / file include」で直感とズレうる
5. community plugin保守・SQLCipher export complianceは継続リスク
6. 2回目以降のPoCは leftover encrypted DB削除が必要（実装済）

---

## 9. Developer diagnostics

- `/preview/local-storage-diagnostics`（development only / production 404）
- Local asset: `capacitor-www` Security autorun + report under `Library/ljd/security-poc/last-report.json`
- Secret全文なし / dummy only / destructive production操作なし

---

## 10. Verification

| Check | Result |
| --- | --- |
| `tsc --noEmit` | pass |
| `vitest` local-first | pass |
| `next lint` | warnings only（既存） |
| `next build` | pass |
| `cap sync ios` + plugin | pass（`ljd-local-security`登録） |
| `xcodebuild` iPhone 17 Simulator | pass |
| Simulator Security suite | pass（fails=0 on clean run） |

---

## 11. Production採否（未確定）

本Phaseは **dummy Security PoC**。main merge・本番暗号・お引越し便接続・本物 journal migrationは禁止／未実施。

A/B 推奨（報告時点）:

- SQLCipher正式へ: **A**
- SecureKeyStore（WhenUnlocked bridge）: **A**
- mediaはOS DP中心で次へ: **A**
- 実機backup/restore次: **A**
- DB path正式確定: **実測待ち**（現状コードはAのまま provisional）
