# Firebase パスワード再設定メール — 確認チェックリスト

LJD のパスワード再設定は **Firebase Authentication の `sendPasswordResetEmail`** のみ使用します（Resend は新規登録完了メール専用）。

コード上の戻り先 URL は `getPasswordResetActionCodeSettings()`（`src/lib/auth/passwordResetActionCode.ts`）で決まります。

```
${NEXT_PUBLIC_APP_URL}/login
```

Preview / 本番で **環境ごとに `NEXT_PUBLIC_APP_URL` が正しいオリジン** になっているかを最優先で確認してください。

---

## 1. Vercel 環境変数

| 変数 | 確認内容 |
|------|----------|
| `NEXT_PUBLIC_APP_URL` | Preview デプロイ URL / 本番 `https://life-journey-zeta.vercel.app` と一致しているか |
| `NEXT_PUBLIC_FIREBASE_*` | 意図した Firebase プロジェクト（本番用）を指しているか |

Preview ブランチでは Preview URL がデプロイのたびに変わる場合があります。固定 Preview ドメインがあればそちらを設定してください。

---

## 2. Firebase Console — Authentication

### テンプレート（Templates）

- **Authentication → Templates → Password reset**
  - 件名・本文が有効か
  - カスタム SMTP を有効にしている場合、SMTP 認証情報が期限切れ・変更されていないか
  - 送信元表示名・アドレスが妥当か

### 承認済みドメイン（Authorized domains）

- **Authentication → Settings → Authorized domains**
  - `life-journey-zeta.vercel.app` が登録されているか
  - Preview 用 `*.vercel.app` または固定 Preview ホストが必要なら追加されているか
  - ローカル確認時は `localhost` があるか

### メール列挙保護（Email enumeration protection）

- 有効時、未登録メールでも「送信しました」と表示される設計（`LoginClient` / `MyPageAccountSection`）です。
- Firebase 側でメールが実際に送られないケースは **SMTP 障害・テンプレート無効・クォータ** などを疑ってください。

---

## 3. 送信挙動の切り分け

| ケース | 確認方法 |
|--------|----------|
| 未登録メール | UI は成功表示でも Firebase は送らない場合あり（列挙保護）。登録済みアドレスで再テスト |
| 登録済み・未ログイン | `/login` の「パスワードを忘れた」から送信 |
| ログイン済み | マイページ「アカウント情報 → パスワード再設定メールを送る」から送信 |
| Google のみログイン | パスワード再設定 UI は非表示（Google 側で管理） |

---

## 4. 迷惑メール・到達性

- 受信トレイ / 迷惑メール / プロモーションを確認
- Gmail の「フィルタ」「転送」設定
- 企業ドメインの場合、Firebase 送信元（`noreply@...firebaseapp.com` 等）のブロック有無

---

## 5. Firebase ログ

- **Authentication → Users** で対象ユーザーを開き、最近の activity を確認
- Google Cloud **Logging** で `identitytoolkit` / Auth 関連エラーがないか（SMTP カスタム利用時は特に）

---

## 6. 本番反映前

- **Preview 環境**でパスワード再設定 → メール受信 → リンクから `/login` で再設定完了まで一連確認
- リサさんのスマホ実機確認 OK 後に main へマージ

---

## 参考：登録完了メール（別系統）

| 項目 | 設定 |
|------|------|
| 送信 | Resend API（`/api/auth/welcome-email`） |
| 必須 env | `RESEND_API_KEY`（任意）、`RESEND_FROM`（任意） |
| 未設定時 | 画面のみ「アカウントを作成しました」。確認メール文言は出ない |

関連: [`EMAIL_DELIVERABILITY_SETUP.md`](./EMAIL_DELIVERABILITY_SETUP.md)（Resend + Firebase SMTP の本番手順）
