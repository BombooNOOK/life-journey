# メール到達率の最大化（Resend + Firebase）

Life Journey Diary の認証メールを、**独自ドメイン経由**で送り、迷惑メールに入りにくくする手順です。

対象メール:

| 種類 | 送信経路 |
|------|----------|
| パスワード再設定 | Firebase Auth → **カスタム SMTP（Resend）** |
| 新規登録完了 | アプリ API → **Resend API** |

---

## Firebase で別途手続きはあるか？

**基本的にありません。** 特別な申請・審査・有料プランへの加入申込は不要です。

やることはすべて **Firebase Console 内の設定** です。

| 項目 | 内容 |
|------|------|
| 申請・審査 | 不要（Console で SMTP とテンプレートを保存するだけ） |
| Blaze プラン | カスタム SMTP 自体に Blaze 必須ではない（通常の Authentication で可） |
| 承認済みドメイン | 既存の `life-journey-zeta.vercel.app` 等はそのまま維持 |
| マルチテナント | URL に `tenant=` が付く場合のみ追加設定が必要（LJD では通常不要） |

Firebase プロジェクト: `bamboonook-life-journey`  
直接リンク: [Authentication → Templates](https://console.firebase.google.com/project/bamboonook-life-journey/authentication/emails)

---

## 全体の流れ（最大効果ルート）

```
① Resend で送信ドメインを認証（DNS）
② Firebase に Resend SMTP を設定
③ Firebase のパスワード再設定テンプレートを日本語化
④ Vercel に RESEND_* / NEXT_PUBLIC_TRANSACTIONAL_EMAIL_FROM を設定
⑤ テスト送信 → 迷惑メールフォルダを確認
```

**カスタム SMTP（Resend）** と **Firebase カスタムドメイン（DNS を Firebase に向ける方式）** はどちらか一方で十分です。  
Resend を既に使うなら、**Resend SMTP 一本化**がおすすめです（登録完了メールと送信元を揃えられる）。

---

## Step 1: Resend でドメイン認証

1. [Resend Dashboard → Domains](https://resend.com/domains) を開く
2. **Add Domain** で送信専用サブドメインを追加  
   例: `mail.あなたのドメイン.jp`（ルートドメインよりサブドメイン推奨）
3. 表示された **SPF / DKIM** の DNS レコードを、ドメイン管理（お名前.com、Cloudflare 等）に追加
4. Resend で **Verify** → ステータスが `verified` になるまで待つ（数分〜最大 72 時間）
5. 可能なら **DMARC** も追加（Resend の Records タブに案内あり）

送信元アドレスの例:

```
BambooNOOK <noreply@mail.あなたのドメイン.jp>
```

`onboarding@resend.dev` は開発用です。本番では使わないでください。

---

## Step 2: Resend API キー

1. [Resend → API Keys](https://resend.com/api-keys) でキーを作成
2. Vercel（Production と Preview）に設定:

```env
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM=BambooNOOK <noreply@mail.あなたのドメイン.jp>
NEXT_PUBLIC_TRANSACTIONAL_EMAIL_FROM=BambooNOOK <noreply@mail.あなたのドメイン.jp>
```

`NEXT_PUBLIC_TRANSACTIONAL_EMAIL_FROM` は、送信完了画面に **想定送信元** を表示するための任意設定です。

---

## Step 3: Firebase に Resend SMTP を設定

1. [Firebase Console → Authentication → Templates](https://console.firebase.google.com/project/bamboonook-life-journey/authentication/emails)
2. 下部の **SMTP settings** → **Enable**
3. 次を入力:

| 項目 | 値 |
|------|-----|
| SMTP server host | `smtp.resend.com` |
| SMTP server port | `465`（推奨。ダメなら `587`） |
| SMTP account username | `resend` |
| SMTP account password | Resend の **API キー**（`re_...`） |
| Sender address | `noreply@mail.あなたのドメイン.jp`（Resend で認証済みのアドレス） |
| Sender display name | `BambooNOOK` または `Life Journey Diary` |

4. **Save**

> 送信元アドレスは、Resend で **verified** になっているドメインと一致させる必要があります。

SMTP 接続の詳細: [Resend SMTP ドキュメント](https://resend.com/docs/send-with-smtp)

---

## Step 4: Firebase テンプレートを日本語化

同じ **Templates** 画面で、**Password reset** の鉛筆アイコンをクリック。

### 件名（コピペ可）

```
【Life Journey Diary】パスワード再設定のご案内
```

### 本文のポイント

- 冒頭にサービス名を明記
- 英語だけの文面を避ける
- 「心当たりがない場合は無視してください」を入れる

Firebase のプレースホルダ（`%LINK%` 等）はそのまま残してください。

**Email address verification** も使う場合は、同様に日本語化しておくとよいです。

---

## Step 5: 動作確認

1. Preview または本番で `/login` を開く
2. 登録済みメールアドレスを入力 → **パスワード再設定メールを送る**
3. 確認すること:
   - 画面に完了メッセージが出る
   - 送信元が `noreply@mail.あなたのドメイン.jp` になっている
   - 受信トレイ or 迷惑メールに届く
4. 迷惑メールに入った場合、Gmail で **「迷惑メールではない」** を一度実行

新規登録完了メールも、同じ `RESEND_FROM` でテスト登録して確認してください。

---

## 迷惑メール対策の優先度

| 優先 | 対策 | 効果 |
|------|------|------|
| 1 | Resend で独自ドメイン認証（SPF/DKIM/DMARC） | 大 |
| 2 | Firebase カスタム SMTP（Resend） | 大 |
| 3 | 件名・本文の日本語化＋ブランド名統一 | 中 |
| 4 | 画面で送信元アドレスを案内 | 中（ユーザー操作） |
| 5 | `onboarding@resend.dev` / `firebaseapp.com` をやめる | 大 |

### 件名で避ける表現

- `!!!` や `【緊急】【重要】` の乱用
- 「無料」「今すぐ」「限定」
- 件名に URL を入れる

---

## トラブルシュート

| 症状 | 確認 |
|------|------|
| Firebase SMTP 保存でエラー | ポート 465/587 を切り替え、API キーを再コピー |
| メールが届かない | Resend Dashboard → Logs で送信ログを確認 |
| 送信元が firebaseapp.com のまま | SMTP が有効か、テンプレート保存後に再送信したか |
| 迷惑メールにだけ入る | DNS 認証完了後 24〜48 時間様子見、ユーザーに「迷惑メールではない」案内 |

関連: [`FIREBASE_PASSWORD_RESET_CHECKLIST.md`](./FIREBASE_PASSWORD_RESET_CHECKLIST.md)

---

## リサさん側で用意するもの

1. **送信に使うドメイン**（メール用サブドメインで可）
2. **DNS 管理画面**へのアクセス（レコード追加）
3. **Resend アカウント**（API キー発行）
4. **Firebase Console** へのログイン（`bamboonook-life-journey`）

コード側の変更は不要です。上記の Console / DNS / Vercel 設定が完了すれば、既存のパスワード再設定・登録完了メールが新しい送信元で動きます。
