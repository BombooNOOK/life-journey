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

- Project Dashboard: `https://vercel.com/dashboard`
- Deployments: `https://vercel.com/dashboard` → 対象プロジェクト `life-journey` → `Deployments`
- Logs: `https://vercel.com/dashboard` → 対象プロジェクト `life-journey` → `Logs`
- Usage: `https://vercel.com/dashboard` → 対象プロジェクト `life-journey` → `Usage`
- 公開URL（疎通確認用）: `https://life-journey-zeta.vercel.app/`

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

- Project Dashboard: `https://console.neon.tech/app/projects` → 対象プロジェクトを開く
- Usage/Billing: `https://console.neon.tech/app/billing`
- Branch/Compute: `https://console.neon.tech/app/projects` → 対象プロジェクト → `Branches`

### 見るポイント

- DBサイズの増加ペース
- Compute時間の急増
- 接続エラーの有無

### しきい値（目安）

- 1週間でDBサイズが想定の2倍ペース → 写真保存方式を見直し検討

---

## 3) Firebase（Auth）

### まず見る

- Authentication Users: `https://console.firebase.google.com/project/bamboonook-life-journey/authentication/users`
- Authentication Settings: `https://console.firebase.google.com/project/bamboonook-life-journey/authentication/settings`
- Usage/Billing: `https://console.firebase.google.com/project/bamboonook-life-journey/usage`
- Firebase Project Home: `https://console.firebase.google.com/project/bamboonook-life-journey/overview`

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

