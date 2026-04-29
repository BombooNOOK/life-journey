# 運用監視リンク集（ここだけ見ればOK）

毎週1回、このファイルのリンクだけ開いて確認します。  
「異常があるときだけ対応」するための最小セットです。

## 0) 基本ルール

- 確認頻度: 週1回（例: 毎週日曜の夜）
- 所要時間: 10〜15分
- 対応条件: しきい値を超えたときだけ

---

## 1) Vercel（アプリ実行）

### まず見る

- Project Dashboard: `<YOUR_VERCEL_PROJECT_URL>`
- Deployments: `<YOUR_VERCEL_PROJECT_URL>/deployments`
- Logs: `<YOUR_VERCEL_PROJECT_URL>/logs`
- Usage: `<YOUR_VERCEL_PROJECT_URL>/usage`

### 見るポイント

- `500` エラーが増えていないか（特に `/api/orders/.../pdf`）
- PDF生成の失敗率が上がっていないか
- 関数実行時間の急増がないか

### しきい値（目安）

- 週あたり `500` エラーが 5件超 → 原因調査
- PDF関連エラーが継続して増加 → 先に修正優先

---

## 2) Neon（DB）

### まず見る

- Project Dashboard: `<YOUR_NEON_PROJECT_URL>`
- Usage/Billing: `<YOUR_NEON_USAGE_URL>`
- Branch/Compute: `<YOUR_NEON_BRANCH_URL>`

### 見るポイント

- DBサイズの増加ペース
- Compute時間の急増
- 接続エラーの有無

### しきい値（目安）

- 1週間でDBサイズが想定の2倍ペース → 写真保存方式を見直し検討

---

## 3) Firebase（Auth）

### まず見る

- Authentication Users: `<YOUR_FIREBASE_AUTH_USERS_URL>`
- Authentication Settings: `<YOUR_FIREBASE_AUTH_SETTINGS_URL>`
- Usage/Billing: `<YOUR_FIREBASE_USAGE_URL>`

### 見るポイント

- 不審なユーザー増加
- 失敗ログインの急増
- Authorized domains に本番ドメインが入っているか

---

## 4) 収益との合わせ見

同時に `docs/revenue-model-ja.md` を更新:

- 注文件数
- 再発行件数（300円）
- 固定費（Vercel/Neon/Firebase）

これで「赤字化の予兆」を早めに検知できます。

---

## 5) 月1で必ずやること

- 予算アラートが有効か再確認
- 不要なPreviewデプロイや古い検証環境の掃除
- 再発行導線（BASEリンク）が有効か確認

