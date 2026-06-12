# 本番 DB（Neon）調査時の注意

通常の開発・検証は **ローカル Postgres** で行います（[DEV_DATABASE.md](./DEV_DATABASE.md)）。  
本番 Neon は **転送量（Network transfer）に課金**されるため、調査スクリプトや `npm run dev` の誤接続で急増することがあります。

## 原則

| やること | 避けること |
|----------|------------|
| 日常は `DATABASE_URL` をローカル（`127.0.0.1:5433`） | `.env` を本番 Neon のまま `npm run dev` |
| サイズ測定はローカル or DB コピー | 本番で `photoDataUrl` を何度もスキャン |
| 本番が必要なら **1回・BOOK_ID 限定** | 全冊ループ・スクリプトの連続実行 |
| 実行前に **何 MB 読むか** を見積もる | `SUM(length(photoDataUrl))` を漫然と繰り返す |
| 実行後に **回数・接続先・概算 MB** を記録 | 同じ調査を本番で再試行 |

## 調査スクリプトのガード

`scripts/lib/safe-database-url.ts` を使うスクリプトは次のとおりです。

- 起動時に **接続先ホスト名** を表示
- **Neon（`*.neon.tech`）やその他リモート** では、環境変数なしでは **停止**
- `photoDataUrl` を読むスクリプトは **追加で** `ALLOW_PROD_PHOTO_DATA_URL_READ=1` が必要

```bash
# ローカル（推奨）
npm run db:local:up
npm run db:local:sync
npx tsx scripts/photo-data-url-stats.ts

# 本番でどうしても1回だけ（非推奨・写真スキャン）
ALLOW_PROD_DB=1 ALLOW_PROD_PHOTO_DATA_URL_READ=1 npx tsx scripts/photo-data-url-stats.ts
```

## 転送量の目安（本番読み取り）

| 操作 | おおよその Neon egress |
|------|-------------------------|
| `photo-data-url-stats.ts`（全 `JournalEntry`） | 写真データ合計と同程度（**数 MB/回**、写真が多いと更大） |
| 旧日記ブック entries API（写真込み JSON） | **~5 MB/冊・1回** |
| 現行 lazy 写真 + entries | entries **小** + 見た写真のみ |
| `GET /api/journal` 一覧（最大120件） | **hasPhoto のみ**（写真本文なし）。本文・コメントは含む |
| `GET /api/journal?year=` 本棚年次フリップ | 最大500件・**photoDataUrl 本文あり**（本棚閲覧用） |
| 鑑定 PDF 1回 | Order **1行**（**数百 KB 級**）。PDF ファイル本体は Neon 外 |

Neon ダッシュボードの Network transfer は **累積**で、表示が **15分〜1時間遅れる**ことがあります。スパイク時刻は Consumption API（hourly）と突合してください。

## 関連スクリプト

| スクリプト | リスク |
|------------|--------|
| `scripts/photo-data-url-stats.ts` | **最高**（`photoDataUrl` 全表スキャン） |
| `scripts/measure-diary-book-entries-payload.ts` | **高**（日記本文・API 相当 JSON） |
| `scripts/verify-diary-book-phase-a.ts` | **書き込み**（本番禁止） |
