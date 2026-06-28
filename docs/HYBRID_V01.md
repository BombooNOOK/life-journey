# LJD ハイブリッド v0.1 — Capacitor 検証環境

v0.1 の目的は、**既存 LJD（Next.js Web UI）が Capacitor WebView 上でオンライン動作するか**を確認することです。  
オフライン保存・同期キュー・しおり等は **v0.2 以降** です。

## 前提

- 作業ブランチ: `feature/hybrid-v0.1-capacitor`
- main の戻し地点: タグ `hybrid-baseline-20260625`
- WebView は **ローカル dev または Vercel Preview URL** を優先（本番 URL 直結は避ける）

## セットアップ

```bash
# 1. ブランチ
git checkout feature/hybrid-v0.1-capacitor

# 2. 依存関係（初回）
npm install

# 3. Next.js 開発サーバー（別ターミナル）
npm run dev

# 4. Capacitor 同期（WebView 先 URL を指定）
CAPACITOR_SERVER_URL=http://127.0.0.1:3000 npm run cap:sync

# 5. Xcode / Android Studio で開く
npm run cap:open:ios
# または
npm run cap:open:android
```

### WebView URL の切り替え

| 環境 | 例 |
|------|-----|
| iOS シミュレータ + ローカル dev | `http://127.0.0.1:3000` |
| Android エミュレータ + ローカル dev | `http://10.0.2.2:3000` |
| 実機 + LAN dev | `http://192.168.x.x:3000`（`npm run dev:lan`） |
| Vercel Preview | `https://xxx.vercel.app` |

URL を変えたら **必ず** `CAPACITOR_SERVER_URL=... npm run cap:sync` を再実行してください。

## v0.1 確認チェックリスト

- [ ] アプリ起動
- [ ] Firebase ログイン
- [ ] 日記新規作成
- [ ] 写真選択
- [ ] 日記保存
- [ ] 日記プレビュー
- [ ] UI 崩れ / SafeArea / キーボード / 戻る操作

## 注意（Firebase 認証）

WebView 内では `signInWithPopup` が環境によって失敗することがあります。  
ログインできない場合は、メールリンク認証や redirect 方式の検討が v0.2 前の課題になります。

## 触らないもの（v0.1）

- 本番デプロイ設定 / main merge
- Prisma / DB migration
- オフライン保存・同期キュー
- Stripe / コメント生成 / 製本 PDF
