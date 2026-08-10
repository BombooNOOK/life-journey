/**
 * Life Journey Diary｜Hybrid Phase 4B-2A Local Storage PoC
 *
 * Status: Working Notes (not Product SoT)
 * Baseline: baseline/capacitor-ios-shell-v8-2026-08-10
 * Branch: feat/local-first-ios-storage-poc
 */

# Hybrid Phase 4B-2A｜Local-first Storage PoC（SQLite + Filesystem）

## 目的

iPhone 端末内に **文章＋画像** を保存し、**サーバーなし・アプリ再起動後でも読み返せる**ことを証明する。

本物のあしあと／Neon／Blob／本番ユーザーは **移さない**。dummy のみ。

製品方針の正本:

- `docs/product/ljd-product-worldview-source-of-truth.md`
- `docs/product/ljd-local-first-and-moving-policy.md`
- `docs/product/ljd-moving-package-spec.md`
- `docs/product/ljd-device-storage-and-restore-spec.md`

## SQLite plugin

| 項目 | 値 |
| --- | --- |
| Package | `@capacitor-community/sqlite` |
| Version（導入時） | `8.1.1` |
| Capacitor 8 互換 | peer `@capacitor/core >= 8.0.0` |
| 管理 | **community-maintained**（公式 core plugin ではない） |
| iOS 依存 | SPM（`Package.swift`）。SQLCipher.swift / ZIPFoundation |
| CocoaPods | 本 PoC では追加しない |
| Android | 今回設定しない |

### SQLCipher / Apple encryption export（follow-up）

本 plugin は **暗号化 OFF の DB でも SQLCipher ライブラリをリンク**する。

- 今回 PoC では DB 暗号化の完成実装は行わない（`no-encryption` / `iosIsEncryption: false`）
- **App Store 配布前**に暗号輸出規制・年次自己分類（self-classification）要件を確認する
- production 正式採用判断は **未確定**

## Filesystem

| 項目 | 値 |
| --- | --- |
| Package | `@capacitor/filesystem` |
| Version（導入時） | `8.1.2` |
| 保存 Directory | **`Directory.Library`**（Cache ではない。LibraryNoCloud は未使用） |
| メディア path 例 | `ljd-poc/media/poc-seed-acorn.png` |

SQLite には画像 Blob を入れない。`media_path` のみ。

## Privacy Manifest

`ios/App/App/PrivacyInfo.xcprivacy` を追加。

- API: `NSPrivacyAccessedAPICategoryFileTimestamp`
- Reason: **`C617.1`**（`@capacitor/filesystem` 公式ドキュメント推奨）

## schema（PoC専用・将来本番コピー前提にしない）

DB name: `ljd_local_first_poc`  
iOS location config: `Library/CapacitorDatabase`

```sql
schema_meta(key, value)  -- schema_version = 1
local_journal_poc(
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  created_at TEXT,
  media_path TEXT NULL
)
```

## Local asset mode

`CAPACITOR_SERVER_URL` **なし**で `capacitor-www`（Local-first Storage Lab）を起動。

```bash
npm run cap:sync:ios:lab
npm run cap:run:ios:lab
```

正式 LJD Next route には露出させない。

## Offline / cold start

必須証拠（2026-08-11 Simulator 確認）:

1. テストあしあと＋画像を保存 — **OK**
2. アプリ terminate → reinstall/relaunch → SQLite／画像再読 — **OK**（同一 id・createdAt・acorn 表示）
3. Next dev server **停止**（`127.0.0.1:3000` 不通）のまま Lab 起動・読込 — **OK**
4. Mac 全体のネットワーク遮断は未実施（勝手に変更しない方針）

## 結果（Phase 4B-2A）

| Test | 結果 |
| --- | --- |
| SQLite write/read | OK |
| Filesystem write/read | OK |
| SQLite media_path → 画像表示 | OK |
| app kill/relaunch persistence | OK |
| Next server 停止 cold start | OK |
| 完全ネットワーク遮断 | 未実施（follow-up） |

## production 採否

**未確定。** 本 PoC は technology validation のみ。Journal / Neon / Blob / どんぐり等は変更しない。

## Known issues / follow-up

- SQLCipher export compliance（配布前）
- community plugin の長期保守リスク評価
- OS バックアップ／Quick Start（別 Phase）
- アプリ削除＝お引越し便の守備範囲
- Simulator 完全 offline（Airplane）再確認は任意
- 本物のあしあと 1 件 Local adapter（次候補 Phase）
- `cap run` の DerivedData パスと古い App.app を取り違えると「plugin not implemented」になる → **ios/DerivedData/... の最新 build**を使う
