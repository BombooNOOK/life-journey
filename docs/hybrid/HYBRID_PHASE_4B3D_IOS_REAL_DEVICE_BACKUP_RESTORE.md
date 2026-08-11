/**
 * Phase 4B-3D — iOS Real Device Backup / Restore Validation
 *
 * Branch: test/ios-local-first-backup-restore
 * Base: dfd18a5d12bfdfbc3451bf5e2388d7fd06218b96 (4B-3C.1 PASS)
 * Status: **STOPPED before destructive / before company-device connect**
 *
 * Production candidates under test (from Simulator PoCs — NOT yet device-validated here):
 * - SQLite: SQLCipher
 * - DB location: Application Support / LJD専用
 * - backup exclusion: LJD force false
 * - protection: NSFileProtectionComplete
 * - DB key: Capacitor SQLite built-in Keychain / WhenUnlocked
 * - media: Library + OS Data Protection
 *
 * main merge: forbidden
 */

# Hybrid Phase 4B-3D｜iOS Real Device Backup / Restore

## 0. Device policy（ユーザー確定）

| 端末 | 役割 | 許可 |
| --- | --- | --- |
| **りさのiPhone**（個人・普段使い） | **4B-3D検証に使用しない** | 触らない |
| **会社用iPhone**（普段使いではない） | Group A のみ | install / dummy作成 / 属性再測 / kill・relaunch・（任意）lock観測。**初期化・erase・restore・uninstall/reinstall・既存データ削除 禁止** |

現時点: 会社用iPhoneは充電切れ → **実機接続待ちで停止**。

---

## 1. Test Group 分類

### Test Group A — 1台・非破壊（会社用iPhone向け）

| ID | 内容 | 状態 |
| --- | --- | --- |
| A1 | development build install（会社用） | **未実施・接続待ち** |
| A2 | dummy encrypted DB + dummy text + dummy image 作成 | 未実施 |
| A3 | DB path / backup exclusion / file protection / Keychain accessibility 再測 | 未実施 |
| A4 | Simulator結果との一致確認 | 未実施 |
| A5 | unlock 中 DB/media read | 未実施 |
| A6 | device lock 中アクセス（可能な範囲。実証不可なら未実証と明記） | 未実施 |
| A7 | app kill → reopen + SQLCipher reopen | 未実施 |
| A8 | reboot + unlock 後 reopen（ユーザー操作。eraseなし） | 未実施 |

**Group Aでやらないこと:** erase / restore / uninstall / iCloud・Finder restore / Quick Start / journalクリア / 本番 DB変更。

### Test Group B — 2台目または破壊的操作が必要

| ID | 内容 | 状態 | 理由 |
| --- | --- | --- | --- |
| B1 | iCloud / Finder backup **作成**と中身確認 | **未実施** | 会社端末の個人・業務データのフルbackupは影響判断が必要。ユーザー操作＋方針確認後 |
| B2 | Restore 後 SQLCipher open | **未実施・禁止** | 端末 restore / erase 禁止 |
| B3 | Quick Start | **未実施** | 安全な2台目なし |
| B4 | uninstall / reinstall / orphan Keychain | **未実施・禁止** | 会社用でも uninstall 禁止 |

---

## 2. Simulator結果（既存・参照のみ。実機と混ぜない）

出典: 4B-3B / 4B-3B.1 / 4B-3C.1（Simulator iPhone 17）

| 項目 | Simulator |
| --- | --- |
| DB候補場所 | Application Support / bundleId |
| plugin parent exclude | 初回 true → LJD false で戻せる |
| Complete | 設定・reopen維持 |
| Keychain WhenUnlocked | 実測 A |
| lock中アクセス | **実証不能（Simulator限界）** |
| OS backup/restore | **未実施** |

---

## 3. Real device結果

**まだ無い。** 会社用iPhone接続後に Group A のみ記入する。

| 項目 | Real device |
| --- | --- |
| モデル / iOS | （接続後） |
| DB実保存場所 | 未測 |
| backup exclusion | 未測 |
| file protection | 未測 |
| lock test | 未実施 |
| reboot test | 未実施 |
| Keychain persistence | 未実施 |
| backup作成 | 未実施（B・要合意） |
| backup内確認 | 未実施 |
| restore | **禁止のため未実施** |
| Quick Start | 未実施 |
| uninstall/reinstall | **禁止のため未実施** |

---

## 4. 停止条件ヒット

今回ヒット:

1. **実機（会社用）未接続・充電切れ** → Group A着手前に停止  
2. **restore / erase / uninstall は方針上禁止** → Group Bは実施しない  
3. **個人端末「りさのiPhone」は検証対象外**

Apple ID / provisioning が必要な段階（初回実機署名）でも、ユーザー操作が要ればその場で停止して案内する。

---

## 5. あなたへの具体案内（次にやること）

会社用iPhoneが充電できたら:

1. **個人の「りさのiPhone」は繋がない／検証対象にしない**  
2. 会社用iPhoneを USB 接続 → 「このコンピュータを信頼」  
3. 開発者モード / ケーブル信頼が表示されたら許可  
4. Mac で Xcode → Settings → Accounts / Devices で会社用が見えるか確認  
5. チャットで合図: 「会社用を接続した。Group Aを開始してよい」  
6. こちらで development build を会社用へ install し、**dummyのみ**で Group A を実行する  

**絶対に自分でやらないでよいこと（禁止）:**  
初期化、消去、restore、LJD uninstall、端末Localクリア（本番データがある場合）。

Backup（Finder暗号化backup）を「中身確認のみ・restoreしない」で試す場合は、**別途合意後**に案内する（会社データの取り扱い確認が先）。

---

## 6. production候補 A/B（現状）

実機未測のため **昇格判定は保留**。Simulator PASS のみでは production 昇格しない。

| 候補 | 判定 |
| --- | --- |
| Application Support 正式採用 | **保留**（実機 Group A 後） |
| SQLCipher 正式採用 | **保留**（実機 reopen 後） |
| built-in Keychain 正式採用 | **保留**（実機 kill/reboot 後） |
| media OS Data Protection | **保留**（実機 lock/reopen 後） |
| production Local-first 基盤昇格 | **B（まだ不可）** |

---

## 7. Diagnostic scaffold

`runRealDeviceGroupAPoc` — 非破壊・dummyのみ・autorunなし・journal非タッチ。  
会社用接続後にボタン実行する想定。
