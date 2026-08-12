/**
 * Phase 4B-3D — iOS Real Device Backup / Restore Validation
 *
 * Branch: test/ios-local-first-backup-restore
 * Base: dfd18a5d12bfdfbc3451bf5e2388d7fd06218b96 (4B-3C.1 PASS)
 *
 * Device policy:
 * - りさのiPhone（個人）: 使用禁止
 * - 会社用 iPhone SE (3rd gen) / iOS 18.5: Group A only
 * - erase / restore / uninstall / 既存削除: 禁止
 *
 * main merge: forbidden
 */

# Hybrid Phase 4B-3D｜iOS Real Device Backup / Restore

## 0. Device policy

| 端末 | 役割 |
| --- | --- |
| りさのiPhone | **検証に使用しない** |
| 会社用 iPhone SE（第3世代）iOS 18.5 | Group A のみ（非破壊） |

---

## 1. Simulator結果（参照・混ぜない）

出典: 4B-3B / 4B-3B.1 / 4B-3C.1

| 項目 | Simulator |
| --- | --- |
| Application Support + include override | PASS |
| Complete | PASS（reopen維持） |
| Keychain WhenUnlocked | PASS |
| lock中アクセス | 実証不能 |
| OS backup/restore | 未実施 |

---

## 2. Real device結果（会社用 SE）

計測時刻例: `2026-08-11T22:07:25Z`（端末ローカルレポート）

| 項目 | Real device |
| --- | --- |
| モデル / iOS | **iPhone SE (3rd generation) / 18.5** |
| DB実保存場所 | `Library/Application Support/app.bamboonook.ljd/`（FileManager解決） |
| dummy encrypted DB create | **pass** |
| DB file backup exclusion | **false** |
| DB parent exclusion | **false**（LJD include経路） |
| media exclusion | **false**（`Library/ljd/media/real-device-group-a`） |
| DB File Protection | 初期 UntilFirstAuth → set後 **Complete**、reopen後も **Complete** |
| media File Protection | 初期 UntilFirstAuth（Complete設定APIは媒体にも実施） |
| Keychain accessibility | **kSecAttrAccessibleWhenUnlocked**（secret本文未取得） |
| encrypted reopen（同一セッション） | **pass**（dummy text一致） |
| lock中アクセス | **実機でも未実証**（`inconclusive_not_demonstrated`。通知は来たが `isProtectedDataAvailableAtProbe≠false`。PASSにしない） |
| app kill → reopen（同一鍵・同一DB） | **pass**（kill後も kc/reopen/media すべて true） |
| reboot → unlock → reopen | **pass**（ユーザー確認: reboot後も全部 true） |
| OS backup作成・中身確認 | **未実施**（合意後） |
| restore / Quick Start / uninstall | **禁止のため未実施** |

### Simulatorとの一致

| 項目 | 一致 |
| --- | --- |
| Application Support 配置 | yes |
| parent/file backup include（false） | yes |
| Complete set + reopen | yes |
| Keychain WhenUnlocked | yes |
| media Library exclude=false | yes |

---

## 3. production候補 A/B（実機 Group A コア後）

| 候補 | 判定 |
| --- | --- |
| Application Support 正式採用 | **A（Group A属性は実機一致）** ※backup/restore実体は未 |
| SQLCipher 正式採用 | **A（実機 encrypt/reopen PASS）** ※restore後openは未 |
| built-in Keychain 正式採用 | **A（WhenUnlocked + kill/reboot後 persistence）** |
| media OS Data Protection | **A寄り（実機 read/excl + kill/reboot後read）** ※lock中拒否は未実証・restore未 |
| production Local-first 基盤昇格 | **まだ保留寄り**（OS backup中身・restore未了。lockは実機試行したが未実証。会社端末では restore 禁止） |

---

## 4. 未実施と理由（会社端末方針）

| 項目 | 理由 |
| --- | --- |
| Finder/iCloud backup中身 | 会社データ取り扱い合意が必要 |
| restore / Quick Start / uninstall | **禁止** |
| lock test | **実施済・未実証**（2026-08-12T01:28:12Z）。`protectedDataWillBecomeUnavailable` は来たが probe時点で protected data がまだ available。Xcode debugger 接続または不完全ロックの可能性。PASSにしない |

---

## 5. Group A 終了（この端末で可能な範囲）

**完了:** 属性再測 + app kill persistence + reboot→unlock persistence  
**lock:** 非破壊で実施。verdict = **`inconclusive_not_demonstrated`（実機でも未実証。PASSにしない）**  
**端末:** 会社用 iPhone SE (3rd) / iOS 18.5（`iPhone (2)`）  
**禁止を守った:** erase / restore / uninstall / 既存データ削除は未実施  
**Artifact:** `docs/hybrid/_real_device_group_a_report.json`／`_real_device_group_a_persistence.json`／`_real_device_group_a_lock_report.json`  
（persistence最終: `2026-08-11T23:23:23.606Z` — reboot後 kc/reopen/media すべて pass）  
（lock finish: `2026-08-12T01:28:12.022Z`）

**main merge: forbidden**

残り（任意）: debugger非接続でもう一度 lock を試す／backup中身確認（合意後）。restore 系はこの端末では行わない。
