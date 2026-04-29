# デプロイ手順（Vercel + Neon + Firebase）

このプロジェクトを「家族・親戚にも使ってもらえる状態」にするための、最短手順です。

## 0. ゴール

- アプリ: Vercel
- データ: Neon Postgres
- ログイン: Firebase Auth

## 1. 先にこのリポジトリでやること

```bash
npm install
npm run db:generate
npm run build
```

問題なければ GitHub に push。

## 2. Neon で DB を作る

1. Neon で Project を作成
2. `Connection string` から Prisma 用 URL をコピー
3. その値を `DATABASE_URL` として使う

## 3. Vercel に環境変数を設定

最低限:

- `DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 4. Prisma マイグレーションを作る（初回だけローカル）

`DATABASE_URL` を Neon 接続先に向けた状態で:

```bash
npx prisma migrate dev -n init_prod
```

作成された `prisma/migrations` をコミットして push。

## 5. Vercel の Build Command

Vercel 設定で Build Command を次に変更:

```bash
npm run build:vercel
```

このコマンドは以下を順に実行します。

1. `prisma generate`
2. `prisma migrate deploy`
3. `next build`

## 6. Firebase の Authorized domains

Firebase Console の Authentication 設定で、以下を追加:

- `xxxxx.vercel.app`
- 独自ドメイン運用時はそのドメイン

## 7. 公開後の確認

- ログインできる
- 日記作成 / 編集できる
- 本棚が開ける
- 本棚設定（タイトル・表紙・期間）が保存できる
- 「この記事を編集する」→「更新する」で元の本ページに戻れる

## 8. よくある詰まり

- `DATABASE_URL` の誤設定
- Firebase domain 未登録
- `prisma migrate deploy` 未実行
- push し忘れ
