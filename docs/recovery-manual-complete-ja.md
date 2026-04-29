# 復旧マニュアル（どのPCでも再開できる版）
この手順は「このMacが壊れた／別のPCで同じことを再開したい」ケースを想定しています。
基本方針は次の通りです。

- コードは GitHub から取得
- データは Neon(Postgres) をそのまま使う
- ログインは Firebase Auth をそのまま使う
- 環境変数（秘密情報）は `.env.local` に復元する

## 0. 事前に確認するアカウント（どれかが欠けると復旧できません）

次のサービスにログインできること。

- GitHub（リポジトリにアクセスできること）
- Vercel（プロジェクトを操作できること）
- Neon（`DATABASE_URL` を確認できること）
- Firebase（Webアプリ設定値・Authorized domains を確認できること）


## 1. すでに用意されている前提（GitHubに含まれているもの）

このリポジトリには以下が含まれている前提です。

- Prisma schema（`prisma/schema.prisma`）
- Prisma のマイグレーション履歴（`prisma/migrations/`）
- アプリのコード
- 生成に必要な設定（`package.json` の scripts）

もし `prisma/migrations/` が存在しない場合は、先に管理者に確認してください（本番DBへ反映できなくなります）。

---

## 2. 別PCで開発を再開する（コピペ中心）

### 2-1) 端末セットアップ

ターミナルで以下を確認します。

```bash
node -v
npm -v
git --version
```

足りない場合はOSの手順でインストールしてください（本手順では省略）。

### 2-2) GitHub からクローン

SSHが使える前提で書きます。SSHが不要なら HTTPS でもOKです。

```bash
cd ~
git clone git@github.com:BombooNOOK/life-journey.git
cd life-journey
```

SSHに必要な鍵がない場合は、後述の「SSHの復旧」を参照してください。

### 2-3) `.env.local` を作る（ここが秘密情報の復元ポイント）

リポジトリ直下で `.env.local` を作成します。

```bash
cd /path/to/life-journey
touch .env.local
```

次をそのまま貼り付けて、括弧の中をあなたの実値に置き換えます。

```env
# DB（Neon Postgres の接続文字列）
DATABASE_URL="<NEON_DATABASE_URL>"

# Firebase（Webアプリ設定値）
NEXT_PUBLIC_FIREBASE_API_KEY="<FIREBASE_API_KEY>"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="<FIREBASE_AUTH_DOMAIN>"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="<FIREBASE_PROJECT_ID>"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="<FIREBASE_STORAGE_BUCKET>"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="<FIREBASE_MESSAGING_SENDER_ID>"
NEXT_PUBLIC_FIREBASE_APP_ID="<FIREBASE_APP_ID>"

# （使っている場合のみ）外部ショップURLなど
# NEXT_PUBLIC_BASE_BOOK_TRIAL_URL="<OPTIONAL_BASE_BOOK_TRIAL_URL>"
# NEXT_PUBLIC_BASE_BOOK_LIGHT_URL="<OPTIONAL_BASE_BOOK_LIGHT_URL>"
# NEXT_PUBLIC_BASE_BOOK_STANDARD_URL="<OPTIONAL_BASE_BOOK_STANDARD_URL>"
# NEXT_PUBLIC_BASE_BOOK_EXTRA_URL="<OPTIONAL_BASE_BOOK_EXTRA_URL>"
```

> 注意: `.env.local` はGitにコミットしないでください。

#### どこで値を取るか（最小）

- `DATABASE_URL`：Neonの `Connection string`（Prisma形式）
- Firebaseの `NEXT_PUBLIC_FIREBASE_*`：Firebase Console → Project settings → General → Your apps → 各値

---

## 3) Prisma を反映（ローカルで起動するため）

### 3-1) Prisma Client 生成

```bash
npx prisma generate
```

### 3-2) DBへマイグレーションを反映

Neon(Postgres) を直接使う前提で、次を実行します。

```bash
npx prisma migrate deploy
```

> すでに本番DBへ反映済みなら「すでに適用済み」系の結果になり、問題ありません。

---

## 4) ローカル起動チェック（最低限）

```bash
npm install
npm run dev
```

ブラウザで以下を確認してください。

- `http://127.0.0.1:3000/`（トップ）
- `http://127.0.0.1:3000/login`（ログイン）
- `http://127.0.0.1:3000/orders/bookshelf`（本棚）

---

## 5) 変更を本番（Vercel）へ反映する（運用）

### 5-1) コードの反映

```bash
git status
git add -A
git commit -m "Update ..."
git push
```

VercelがGitHub連携されていれば自動デプロイされます。

### 5-2) Vercelの Build Command（念のため確認）

Vercelの Project Settings → Build Command が次になっているか確認します。

```bash
npm run build:vercel
```

> これにより `prisma migrate deploy` が実行されます。

---

## 6. SSHの復旧（期限に左右されない方式）

SSH鍵がない／端末を変えたときにやる手順です。

1. 鍵があるか確認

```bash
ls -la ~/.ssh
```

2. なければ作成（ed25519）

```bash
ssh-keygen -t ed25519 -C "github-BombooNOOK" -f ~/.ssh/id_ed25519 -N ""
```

3. GitHubへ公開鍵を登録（公開鍵をコピーして貼り付け）

公開鍵の中身を表示してコピーしてください。

```bash
cat ~/.ssh/id_ed25519.pub
```

GitHub → Settings → SSH and GPG keys → New SSH key → 貼り付け

4. 端末側で疎通確認

```bash
ssh -T git@github.com
```

成功したら、以降 `git push` はトークン期限を気にせず使えます。

---

## 7. それでも復旧できないとき（切り分け）

最初に見るべきは次の順です。

1. `.env.local` の値が欠けていないか（特に `DATABASE_URL` と Firebaseの `NEXT_PUBLIC_*`）
2. `npx prisma migrate deploy` が失敗していないか
3. Vercelの Build Command が `npm run build:vercel` になっているか
4. Firebaseの Authorized domains に Vercelのドメインが入っているか

---

## 8. あなた向けの「保管リスト」（コピペ用）

このマニュアルを安心して運用するため、下の欄に情報を控えておくと復旧が爆速になります。

- `NEON_DATABASE_URL`: （　　　　　　　　　　　）
- `FIREBASE_API_KEY`:（　　　　　　　　　　　）
- `FIREBASE_AUTH_DOMAIN`:（　　　　　　　　　　　）
- `FIREBASE_PROJECT_ID`:（　　　　　　　　　　　）
- `FIREBASE_STORAGE_BUCKET`:（　　　　　　　　　　　）
- `FIREBASE_MESSAGING_SENDER_ID`:（　　　　　　　　　　　）
- `FIREBASE_APP_ID`:（　　　　　　　　　　　）

