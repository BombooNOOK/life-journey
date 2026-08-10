# Hybrid Phase 4B-1b ｜ チャッピーくん向け引き継ぎ報告書

**Status:** Working Notes（Product SoT ではない）  
**Date:** 2026-08-10  
**Repo:** `/Users/kimurarisa/life-journey`  
**Branch:** `feat/capacitor-ios-shell-v8`  
**Baseline commit (4B-1):** `fb936a5c265af3c324815ee0c336eb3266bed7a7`  
**main / origin/main:** 触らない・mergeしない

---

## 1. 目的（再確認）

Phase 4B-1 / 4B-1b は **iOS Capacitor Shell の器＋認証導線確認**まで。  
最終目的は Local-first（端末原本）だが、**今回は SQLite / Filesystem / Local-first 実装に進まない**。

Product 前提 SoT:

- `docs/product/ljd-product-worldview-source-of-truth.md`
- `docs/product/ljd-local-first-and-moving-policy.md`
- `docs/product/ljd-moving-package-spec.md`
- `docs/product/ljd-device-storage-and-restore-spec.md`

Shell 手順メモ: `docs/hybrid/HYBRID_PHASE_4B1_IOS_SHELL.md`

---

## 2. ユーザー（森守り）の方針

- 難しい操作は Cursor / ChatGPT 側で進める
- ユーザーは **本人しかできない操作のみ**担当
- 本番相当データ閲覧は不要（誤って期待していたわけではない）
- 秘密値（`.env.local` の中身）をチャットに出さない
- Firebase Authorized Domain を危険に緩めない
- main merge 禁止

---

## 3. 環境・Shell 現状（確定）

| 項目 | 値 |
| --- | --- |
| Capacitor | 8.5.0（core / cli / ios） |
| Plugins | app 8.1.1 / keyboard 8.0.5 / status-bar 8.0.3 |
| Android | 未着手（今回触らない） |
| Packages 管理 | SPM（CocoaPods なし） |
| appId | `app.bamboonook.ljd` |
| display name | Life Journey Diary |
| webDir | `capacitor-www`（placeholder。完成版 LJD ではない） |
| remote shell | `CAPACITOR_SERVER_URL` 時のみ。**検証専用・本番 URL ハードコード禁止** |
| 検証 URL | `http://127.0.0.1:3000`（Simulator ↔ ローカル Next） |

### .env.local

- **用意方法:** 旧正規環境 `numerology-mvp/.env.local` を **中身を表示せずコピー**
- `.gitignore` の `.env*.local` 対象を確認済み（commit しない）
- `CAPACITOR_SERVER_URL=http://127.0.0.1:3000` を追記済み
- `DATABASE_URL` は **LOCAL Docker**（`127.0.0.1:5433` / `ljd_dev`）＝本番 Neon ではない
- そのため **ログハウスに入っても本番あしあと／森ログは出ない**のは正常（データ問題ではない）

---

## 4. 認証・導線検証（ユーザー操作で進行中）

### 成功していること

- メールログインで **認証成功**
- **一瞬ログハウス到達**を確認
- sticky header「Life Journey Diary」タップで **ログハウスに戻れた**
- Keyboard: Simulator でソフトキーがフィールドを隠す問題あり → **通常スクロールではない方法／⌘K・Hardware Keyboard**で入力成功（重大コード変更なし）

### 観察された Web 既存挙動

- ログイン後、オンボーディングにより **「はじめての道しるべ」へ切り替わる**ことがある  
  → Capacitor 固有バグというより、ローカル DB 上のオンボーディング未完了に近い既存導線
- ローカル DB なので中身が空に見えるのは想定内

### ユーザーがいま実施する操作（人間のみ）

1. メニュー等から **「森から出る（ログアウト）」**
2. 終わったら Cursor に合図

未確認（合図後に Cursor が screenshot／ログで確認）:

- Firebase logout
- `lj_logged_in` / `lj_user_email` / session クリア
- Home 等へ戻る
- 再度ログインできるか（再ログインは必須ではないが望ましい）

Google OAuth は 4B-1 **完了条件にしない**。

---

## 5. Safe Area / Keyboard / Web 回帰

| 項目 | 状態 |
| --- | --- |
| viewport-fit=cover | layout に追加済み |
| SiteHeader | `pt-[env(safe-area-inset-top)]` 追加済み（ログインヘッダ重複を緩和） |
| Keyboard plugin | iOS only `KeyboardResize.Body` |
| Simulator keyboard UX | ソフトキーがパスワードを隠す → Hardware Keyboard / ⌘K で回避。UI再設計はしない |
| Web版重大回帰 | 未最終確認（build/lint 後に軽く確認予定）。CapacitorShellInit は native 時のみ動作 |

---

## 6. App Icon

- 4B-1 時点: Capacitor デフォルト青ロゴ（非正式）
- 4B-1b: 正式採用済み PWA／Web 資産 `public/icons/icon-512.png`（フクロウ）を **1024 PNG にリサイズ**して  
  `ios/.../AppIcon.appiconset/AppIcon-512@2x.png` に反映（**新規デザイン生成なし**）
- **未 commit**（作業ツリーに変更あり）→ 次 commit で入れる想定

Splash は必須変更なし。

---

## 7. 外部リンク調査（plugin 未追加）

現状コード:

- 内部: Next / WebView 内遷移
- 外部: `target="_blank"` / `window.open(..., "_blank")` 等（例: BASE `bamboonook.base.shop`、案内図の external スポット）

**正式方針（第一候補）:** 外部は system browser / Safari  
**今回:** `@capacitor/browser` は **勝手に追加しない**。要否は follow-up 小 Phase。

現状 Simulator での実タップ確認は薄い → 残課題として Browser plugin 要否を報告予定。

---

## 8. 禁止事項（継続）

SQLite / Filesystem / Preferences / Local-first 実装 / あしあと保存方式変更 / Firebase Auth 大改修 / Google OAuth workaround 乱用 / Android / Prisma・本番データ変更 / main merge

---

## 9. Cursor が引き続きやる予定

1. ユーザーの logout 合図後: screenshot・session 確認
2. `npm run build` / `tsc --noEmit` / `npm run lint`
3. `cap sync ios` + native build + Simulator（必要なら）
4. AppIcon commit + feature branch push（main なし）
5. Hybrid docs 更新（4B-1b 結果）
6. A/B 判定報告（main 統合 / 4B-2 PoC）

---

## 10. 4B-1b 検証結果（更新 2026-08-10 23:39 JST）

| 項目 | 結果 |
| --- | --- |
| メールログイン | **成功** |
| ログハウス到達 | **成功**（一瞬／ヘッダ復帰含む） |
| session DELETE | **成功**（`DELETE /api/auth/session` 200 ×2） |
| 森から出る | **成功** → Home（「ログインはこちら」表示） |
| ローカル DB 空データ | **想定内**（本番データ不要） |
| はじめての道しるべ遷移 | 既存オンボーディング挙動。Shell 致命傷ではない |
| keyboard | Simulator でフィールド隠れあり → HWキーボード／⌘K／特殊スクロールで入力可。UI再設計なし |
| App icon | 正式 `public/icons/icon-512.png` → 1024 PNG 反映（commit 対象） |
| 外部リンク Safari 固定 | **未実装**（follow-up）。`@capacitor/browser` 未追加 |
| build / tsc / lint | 実行済み（警告のみ・exit 0想定） |

### A/B（報告時点）

| 判断 | 判定 | 理由 |
| --- | --- | --- |
| main 統合 | **A寄り（条件付き）** | Shell＋メール認証往復は満たす。ただし **remote shell 仮設・Browser follow-up・PR レビュー**を残す。agent は main merge しない |
| 4B-2 SQLite/Filesystem PoC | **A（別 branch）** | iOS Shell 認証確認は足りた。PoC は `feat/...` 新規 branch。4B-1 と混ぜない |

**必須のあと作業（ChatGPT / Cursor）:** feature commit＋push（icon＋本 handoff）、Hybrid docs 追記、PR 作成はユーザー依頼時のみ。

---

## 11. ChatGPT への依頼フレーズ（コピー用）

```
Life Journey Diary Hybrid 4B-1b 引き継ぎ（logout確認済み）。
正規環境 /Users/kimurarisa/life-journey
branch feat/capacitor-ios-shell-v8（main merge禁止）
詳細は docs/hybrid/HYBRID_PHASE_4B1B_HANDOFF_FOR_CHATGPT.md
続き: AppIcon+handoff の commit/push確認、外部リンク Safari 方針の小Phase設計、main統合の条件付きAのレビュー。
SQLite/Local-first実装はまだしない（4B-2は別branch）。secretをチャットに出さない。
```
