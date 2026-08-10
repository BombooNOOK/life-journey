/**
 * Life Journey Diary｜Hybrid Phase 4B-1 iOS Shell
 *
 * Status: Working Notes (not Product SoT)
 * Baseline: baseline/pre-capacitor-implementation-2026-08-10
 */

# Hybrid Phase 4B-1｜Capacitor 8 iOS Shell

## 目的

iOS 上に Capacitor 8 の「器」だけを安全に用意し、現行 LJD（Next）を WebView で検証できるようにする。

最終目的は **Local-first（端末原本・オフラインで森へ帰れる）** であり、Web 版をアプリの箱に入れ続けることではない。製品方針は:

- `docs/product/ljd-product-worldview-source-of-truth.md`
- `docs/product/ljd-local-first-and-moving-policy.md`
- `docs/product/ljd-moving-package-spec.md`
- `docs/product/ljd-device-storage-and-restore-spec.md`

## remote shell は仮設（重要）

`CAPACITOR_SERVER_URL` による remote WebView は **Phase 4B-1 検証専用**。

- 本番 URL を `capacitor.config.ts` にハードコードしない
- env 指定時のみ remote mode
- `capacitor-www` は初期化用プレースホルダ（完成版 LJD ではない）
- 最終 Hybrid では SQLite / Filesystem 等へ段階移行し、remote URL 固定は採用しない
- HTTP cleartext は Simulator / LAN スモーク用。本番前提にしない

## 起動方法（Simulator）

別ターミナルで Next を起動:

```bash
npm run dev
```

Capacitor sync（iOS only）:

```bash
npm run cap:sync:ios:local
# または
CAPACITOR_SERVER_URL=http://127.0.0.1:3000 npm run cap:sync:ios
```

Xcode / Simulator:

```bash
npm run cap:open:ios
# または
npm run cap:run:ios
```

### env

`.env.local`（Git 外）:

```bash
CAPACITOR_SERVER_URL=http://127.0.0.1:3000
# Preview 例（Firebase Authorized Domain が必要）
# CAPACITOR_SERVER_URL=https://your-preview.vercel.app
```

見本は `.env.local.example`。

### sync / open / run

| script | 用途 |
| --- | --- |
| `npm run cap:sync:ios` | URL 解決して `cap sync ios` |
| `npm run cap:sync:ios:local` | 明示的に 127.0.0.1:3000 |
| `npm run cap:open:ios` | Xcode を開く |
| `npm run cap:run:ios` | Simulator で起動（local URL） |

絶対パス依存なし。

## 実機

Simulator 安定後に進める。署名・Apple Developer 設定は勝手に変更しない。必要なら報告して人手設定。

実機では `127.0.0.1` は使えない。LAN IP + `npm run dev:lan` または Vercel Preview（**推奨**: Firebase Authorized Domain）。LAN IP は Firebase の Authorized domains に通常登録できない。

## 既知の制約

- Android project / SDK は本 Phase 対象外
- Next 全体の static export 不可 → local `webDir` に完全 UI は載せない
- Google OAuth popup/redirect は WebView で不安定になり得る。**Firebase 設定を危険に緩めない**。email/password 等で「森に入る → ログハウス」を優先確認
- `@capacitor/browser` 未導入。外部リンクは現状 WebView 内遷移の可能性。Safari 固定が必要なら 4B-1 後続で plugin 検討
- CocoaPods 未使用（Capacitor 8 / SPM）
- iOS `AppIcon` は Capacitor デフォルト（青 Capacitor ロゴ）。現行 LJD のフクロウ正式アイコンと不一致のため、**本 Phase では差し替えない**（世界観一致後に正式資産へ）
- `viewport-fit=cover` 後、SiteHeader に `safe-area-inset-top` を付与（ログイン等の sticky chrome）。森フルブリード画面は従来どおり safe-area ユーティリティ利用
- ローカル検証には `.env.local`（Firebase 等）が必要。無い場合ログイン完了〜ログハウス到達は未検証扱い

## Firebase

本番 Firebase 設定を勝手に変更しない。Preview domain 制約がある場合は Shell 起動・公開画面と認証課題を分離報告する。

## 次の Local-first Phase（4B-2）

Shell が安定したら:

- SQLite 最小 PoC
- Filesystem 最小 PoC
- 端末内テストデータ 1 件
- オフライン再読

お引越し便・どんぐり・Neon 移行はまだ行わない。

## identity

- appId: `app.bamboonook.ljd`
- display name: `Life Journey Diary`

## Phase 4B-1b 結果メモ（2026-08-10）

メールログイン往復（入林〜ログハウス〜森から出る）を Simulator で確認。詳細は `HYBRID_PHASE_4B1B_HANDOFF_FOR_CHATGPT.md`。

- AppIcon: 正式資産 `public/icons/icon-512.png` 由来に差し替え
- 外部 Safari 固定 / `@capacitor/browser` は未実装（follow-up）
- ローカル Docker DB のためデータ空は想定内
