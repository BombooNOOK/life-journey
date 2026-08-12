/**
 * Phase 4B-3C.1 — Production Storage Location PoC
 *
 * Branch: feat/local-data-storage-location-poc
 * Base: c9f8ffd8882bff300cd3697b50c8e84621bacb0a (key integration PASS)
 * Simulator: iPhone 17 / iOS 26.5
 * Dummy DB only — ljd_local_journal not migrated/encrypted
 * main merge: forbidden
 */

# Hybrid Phase 4B-3C.1｜Production Storage Location PoC

## Apple guideline照合

| 場所 | Guideline | LJD判断 |
| --- | --- | --- |
| Documents | user-managed documents（Files露出し得る） | **比較のみ。production即決しない** |
| Application Support | app-created support files、backup既定、`<bundleId>`配下 | **production第一候補** |
| Library/CapacitorDatabase | ガイドライン外の暫定plugin配置 | formal不採用方向 |

絶対pathは FileManager `.applicationSupportDirectory` + `Bundle.main.bundleIdentifier` で解決（hardcodeしない）。  
plugin設定は相対: `Library/Application Support/app.bamboonook.ljd`。

## 実測結果（Simulator）

### Application Support（候補A）

| 項目 | 結果 |
| --- | --- |
| SQLCipher配置・open/close | **pass**（path配下に `ljd_storage_location_pocSQLite.db`） |
| encrypted reopen | **pass** |
| wrong key | **pass** |
| plugin初回 `createDatabaseLocation` | **LJD AS parent `isExcludedFromBackup=true`**（AS rootは false） |
| LJD `setExcludedFromBackup(false)` | **pass**（即座に false） |
| DB reopen後 | **false維持**（pluginは既存dirでは除外を再設定しない） |
| kill/relaunch後 | **false維持（pass）** |
| `NSFileProtectionComplete` | set後・reopen後とも **Complete維持** |

### Documents（候補B・比較）

- probe: `excl=false` / parent `false`
- Files露出リスクあり → production第一候補にしない

### Library/CapacitorDatabase（候補C・現行暫定）

- 過去4B-3B: plugin作成親は **excl=true**
- 本PoCのprobe aloneでは親excl=falseになり得る（plugin createDatabaseLocation未経由）
- formal不採用方向は維持

### media

変更なし。`Library/ljd/media/...` の 4B-3B `isExcludedFromBackup=false` を維持。

## 比較まとめ → 推奨 **A**

| 基準 | A AS | B Documents | C CapDB |
| --- | --- | --- | --- |
| backup対象 | force-include後 **included** | included | 親 excluded（plugin時） |
| Files露出 | 低 | 高 | 低 |
| plugin互換 | **可**（相対Library path） | 可（default） | 可（現行） |
| SQLCipher | **可** | 可 | 可 |
| file protection Complete | **維持** | （未本PoC焦点） | — |
| guideline | **一致** | 不一致（documentではない） | 弱い |
| maintenance | exclusion override bridge が必要になり得る | 低 | 中 |

**additional native bridge（production）:** **要** — pluginが初回に親を backup exclude=true にするため、起動時（または初回DB準備時）に LJD側で `isExcludedFromBackup=false` を明示する最小bridgeを製品経路に含める。fork不要。

## SQLCipher＋Keychain最終構成（変更なし）

`setEncryptionSecret` → plugin built-in Keychain（WhenUnlocked実測）→ SQLCipher open  
LJD SecureKeyStoreをDB鍵に統合しない。

## Security SoT更新（branch内）

`docs/product/ljd-local-data-security-spec.md`:

- §4.1/§5.0: DB鍵 = plugin built-in WhenUnlocked
- §4.3: Application Support 第一候補、Documents比較のみ、CapDB formal不採用方向
- main未merge

## Verification

- tsc OK / cap sync / xcodebuild Simulator OK / PoC fails=0（clean run）
