/**
 * Phase 4B-3B.1 — SQLCipher / Key-management integration PoC
 *
 * Status: Feature-branch measurement (Simulator iPhone 17)
 * Branch: feat/local-data-protection-key-integration-poc
 * Base: 37792136a06b491ad879611ca474509d6dc276fc (4B-3B)
 * Dummy data only — no real journals / photos
 *
 * Parent docs:
 * - docs/hybrid/HYBRID_PHASE_4B3B_LOCAL_DATA_PROTECTION_POC.md
 * - docs/product/ljd-local-data-security-spec.md
 */

# Hybrid Phase 4B-3B.1｜SQLCipher 鍵経路統合 PoC

## 0. 最重要判定（先に結論）

**SQLCipher DBを実際に開く鍵**は、installed `@capacitor-community/sqlite@8.1.1` において次に保存される:

| 項目 | 値（FACT） |
| --- | --- |
| Store | iOS Keychain `kSecClassGenericPassword` |
| service | `unlockSecret` |
| account（本プロジェクト config） | `ljd_CapacitorSQLitePlugin`（=`${iosKeychainPrefix}_CapacitorSQLitePlugin`） |
| 書込API | `setEncryptionSecret` / `changeEncryptionSecret` / `clearEncryptionSecret` |
| 読込経路 | `Database.open` → `UtilsSecret.getPassphrase(account)` → SQLCipher password |
| JSから createConnection へ直接 passphrase 渡し | **不可**（APIにフィールド無し） |

**実測 accessibility（secret本文は未取得・未ログ）:**  
`kSecAttrAccessibleWhenUnlocked`（`kSecReturnData=false` の attributesのみ）→ **Verdict A**

したがって製品で使う「1本の経路」の第一候補は:

> **Plan A — plugin built-in Keychain（WhenUnlocked実測）＋ `setEncryptionSecret` / `mode:"secret"|"encryption"`**

LJD SecureKeyStore bridgeは **SQLCipher openには不要**（別用途・将来Android用に残す）。  
fork/patchは **不要**（sole LJD Keychain必須にしない限り）。

---

## 1. Plugin built-in accessibility 実測

Diagnostic: `LjdLocalSecurity.inspectGenericPasswordAccessibility`  
- `kSecReturnAttributes=true`
- **`kSecReturnData=false`（secret本文を読まない）**

| 項目 | 結果 |
| --- | --- |
| found | true |
| accessibility | `kSecAttrAccessibleWhenUnlocked` |
| accessibilityRawPresent | true |
| returnedSecretData | false |
| Verdict | **A** |

Source上 `KeychainWrapper.storeGenericPasswordFor` は仍 `kSecAttrAccessible` を明示していない。  
今回は **保存後itemの実属性**が WhenUnlocked であることを確認した（Apple default整合）。  
明示setに比べ将来リスクは残るが、現行itemは要件の第一候補（WhenUnlocked）を満たす。

---

## 2. Source追跡（推測禁止）

根拠ファイル:

- `UtilsSecret.swift` — service `"unlockSecret"`、account `"${prefix}_CapacitorSQLitePlugin"`
- `CapacitorSQLite.swift` — `iosKeychainPrefix` で account 構築
- `Database.swift` open — `encrypted && mode ∈ {secret,encryption,decryption}` のとき Keychain passphrase
- `definitions.d.ts` — `capConnectionOptions` に passphrase 無し

Legacy account `CapacitorSQLitePlugin`（prefixなし）は本configでは **found=false**。

---

## 3. 3案比較

| 案 | 結果 | 要約 |
| --- | --- | --- |
| **A built-in** | **recommended** | WhenUnlocked実測＋SQLCipher open一体。製品1本経路の第一候補 |
| **B LJD→plugin** | viable_with_js_handoff | `SecureKeyStore`→JS一回→`setEncryptionSecret`でopen可能。ただし **pluginは自前Keychainのみ参照**。二重保管＋JS handoff。fork無しでは「LJDがsole」にはならない |
| **C fork** | **not_needed** | A成立のため不要。sole LJD Keychain必須時のみ再評価 |

Plan B open PoC: pass（dummy DB）。製品推奨にはしない（二重鍵・handoff）。

---

## 4. Documents 保存場所

4B-3B実測維持:

- Library/CapacitorDatabase **parent** `isExcludedFromBackup=true` / file false
- Documents parent/file **false**
- media `Library/ljd/media/...` **false**

**Documentsを正式DB場所候補にしてよいか: A（候補として扱う）**  
foundationの `iosDatabaseLocation` は **まだ変更しない**。  
実機iCloud Backup/restore後に最終確定。SQLCipher採用時、backup上の平文脅威は下がるが、restore成功・鍵同行がより重要。

---

## 5. 正式推奨構成（現時点）

1. **DB暗号鍵:** plugin `setEncryptionSecret` → built-in Keychain（service `unlockSecret`）  
2. **Open:** `encrypted:true` + `mode:"secret"` / migrationは `mode:"encryption"`  
3. **LJD SecureKeyStore:** SQLCipher以外・将来Android用 adapterとして維持。DB open経路には乗せない  
4. **Location:** Documentsを正式候補として設計議論、コード切替は実機backup後  
5. **media:** OS Data Protection中心（前回どおり）  
6. **moving package key:** 別系統（非接続）

---

## 6. A/B 報告票

| 問い | 答 |
| --- | --- |
| plugin secret 実accessibility | **A**（WhenUnlocked） |
| SQLCipherが使うsecret経路 | built-in Keychain `unlockSecret` / `ljd_CapacitorSQLitePlugin` |
| built-in 正式採用（DB鍵） | **A** |
| LJD SecureKeyStoreをDB鍵に必須か | **否**（openには不要） |
| fork/patch必要性 | **否** |
| SQLCipher＋鍵管理の正式推奨 | Plan A（上記§5） |
| Documentsを正式DB候補にできるか | **A**（候補。foundation未変更） |
| 実機backup/restoreへ進めるか | **A**（次に進む条件は整った。本Phaseでは未実施） |

---

## 7. Verification

- Simulator: key-integration-report failsなし
- accessibility probe: secret未読
- tsc / cap sync / xcodebuild: 実施

main merge: **禁止・未実施**
