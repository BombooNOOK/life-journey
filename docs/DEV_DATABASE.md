# ローカル DB で開発する（Neon 転送量を温存）

開発中は **ローカル Postgres** に接続し、形が固まったら **Neon** で最終確認する運用を推奨します。

## 1. 初回セットアップ

```bash
# Postgres 起動（ポート 5433）
npm run db:local:up

# .env.local を用意（未作成なら）
cp .env.local.example .env.local
# → DATABASE_URL がローカル向きになっていることを確認

# スキーマ適用 + Prisma Client 生成
npm run db:local:sync

# 開発サーバ（同一 Wi‑Fi の iPhone から見る場合）
npm run dev:lan
```

ブラウザ: `http://192.168.x.x:3000`（Mac の IP は `ipconfig getifaddr en0` など）

## 2. 日常の開発

| 作業 | コマンド |
|------|----------|
| DB 起動 | `npm run db:local:up` |
| DB 停止 | `npm run db:local:down` |
| スキーマ反映 | `npm run db:local:sync` |
| **DB まっさらにして再構築** | `npm run db:local:reset` |
| アプリ起動 | `npm run dev` または `npm run dev:lan` |

ログインは Firebase のまま。プロフィールは **初回アクセス時に自動作成**されます（Neon と別データです）。

## 3. Neon に切り替えて最終確認

1. `.env.local` の `DATABASE_URL` を Neon の接続文字列に差し替え
2. `npm run db:migrate:deploy`（未適用 migration があれば）
3. `npm run dev:lan:fresh` でキャッシュクリア起動
4. 動作確認後、開発に戻すなら再度ローカル `DATABASE_URL` に戻す

## 4. トラブル

### 「マイページを読み込めませんでした」+ data transfer quota

Neon の転送量上限です。ローカル `DATABASE_URL` に切り替えるか、Neon の次の請求期間まで待ちます。

### プロフィールはあるのに日記が空

ローカル DB は Neon と **データは共有されません**。ローカルでは新規に記録を書くか、必要なら別途ダンプ/復元が必要です。

### ポート 5433 が使えない

`docker-compose.yml` の `5433:5432` を変更し、`DATABASE_URL` のポートも合わせてください。

## 5. カレンダー API の軽量化

`/api/journal?month=YYYY-MM&view=calendar` は **写真・読み解き本文を返しません**（転送量削減）。  
日記カレンダー・マイページの月表示はこのモードを使います。編集・プレビューは `/api/journal/[id]` で全文取得します。
