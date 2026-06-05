# 日記写真用 Vercel Blob（Private）セットアップ

鑑定 PDF 用 Blob とは **別の Private Blob Store** です。  
認証は **OIDC 優先**（Vercel 本番の推奨方式）。Read/Write Token はローカル・緊急用の任意フォールバックです。

## Dashboard 手順（画面操作）

1. [Vercel Dashboard](https://vercel.com) → プロジェクト **life-journey**
2. **Storage** → 日記写真用 Blob Store（例: `ljd-journal-photos`）を **Private** で作成
3. **Connect to Project** で life-journey に接続
4. Store の **Info** に表示される **`BLOB_STORE_ID`** をコピー

接続後、プロジェクトには次が付きます（日記 Store 接続時）:

- `BLOB_STORE_ID` … 接続した Store の ID（**日記コードでは使わない**）
- `VERCEL_OIDC_TOKEN` … デプロイごとに Vercel が自動注入（手動設定不要）
- `BLOB_WEBHOOK_PUBLIC_KEY` … Webhook 検証用

「Read/Write Token を revoke 推奨」と表示されていても、**OIDC 接続なら Token は不要**です。

## 環境変数（日記写真）

| 変数 | 必須 | 用途 |
|------|------|------|
| **`JOURNAL_PHOTO_BLOB_STORE_ID`** | **本番で必須** | 日記写真 Store の ID（Info の `BLOB_STORE_ID` と同じ値） |
| `VERCEL_OIDC_TOKEN` | Vercel 上は自動 | デプロイ実行時に自動。ローカルは `vercel env pull` |
| `JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN` | 任意 | ローカル・緊急フォールバックのみ |

### 鑑定 PDF（変更しない）

| 変数 | 用途 |
|------|------|
| `BLOB_READ_WRITE_TOKEN` | 鑑定 PDF 用（`orderPdfBlobCache.ts`）。**日記とは別 Store・別変数** |

日記写真の `put` / `get` / `del` は **`BLOB_STORE_ID`（プロジェクト既定）に依存しません**。  
必ず **`JOURNAL_PHOTO_BLOB_STORE_ID`** のみを参照します。PDF 用 Token との競合はありません。

## 認証の優先順位（コード）

1. `JOURNAL_PHOTO_BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN` → **OIDC**（`storeId` 明示、`token` は渡さない）
2. `JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN` → **Token** フォールバック
3. どちらもない → 新規写真は **`photoDataUrl`（legacy）** に保存（Neon 転送増。本番では避ける）

## Vercel 本番

**追加するもの（手動）:**

```env
JOURNAL_PHOTO_BLOB_STORE_ID=store_xxxxxxxx   # 日記 Store の Info からコピー
```

**自動（設定不要）:**

- `VERCEL_OIDC_TOKEN` … Production / Preview のランタイムに注入

Preview でも日記写真を試す場合は、同じ `JOURNAL_PHOTO_BLOB_STORE_ID` を Preview にも登録してください（Store を分ける場合は Preview 用 ID を別途設定）。

## ローカル開発

### 推奨: OIDC（`vercel env pull`）

```bash
vercel link   # 未リンクなら
vercel env pull .env.local
```

`.env.local` に以下が入る想定です:

- `JOURNAL_PHOTO_BLOB_STORE_ID`（手動で Vercel に登録した値が pull される）
- `VERCEL_OIDC_TOKEN`（短期トークン）

### 代替: Read/Write Token

OIDC が使えない場合のみ:

```env
JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

### 未設定時

Blob 認証が無い場合、新規写真は **`photoDataUrl` にフォールバック**（警告ログあり）。  
表示・既存データの互換は維持されます。

## パス規則

`journal-photos/{profileId}/{entryId}.webp`（mime に応じて拡張子）

## 表示

ブラウザは `/api/journal/entries/{entryId}/photo` 経由（Cookie 認証）。Private Blob URL を直貼りしません。
