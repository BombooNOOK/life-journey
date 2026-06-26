# BambooNOOK 投稿アトリエ — 実装状況引き継ぎ（チャッピーくん用）

**作成日**: 2026-06-24  
**リポジトリ**: numerology-mvp（LJD / BambooNOOK）  
**担当チャット**: 投稿アトリエ専用（Cursor 実装）  
**本番反映**: 未実施（commit / push 待ち）

---

## 1. 機能の位置づけ

| 項目 | 内容 |
|------|------|
| 正式名称 | BambooNOOK 投稿アトリエ / SNS投稿アシスト工房 |
| 利用者 | 管理者のみ（BambooNOOK 運営） |
| 目的 | Instagram 等の毎日投稿用の**文案作成・保存・コピー・ステータス管理** |
| やらないこと | SNS API 連携、自動投稿、Meta 連携、外部 AI API |

LJD 本体（日記・鑑定・製本・本棚・プロフィール・解約）には**干渉していない**。

---

## 2. 実装済みスコープ（Step 1 MVP）

### 2.1 画面・ルート

| ルート | 内容 |
|--------|------|
| `/admin/post-atelier` | トップ（ステータス件数サマリ・最近更新した投稿案） |
| `/admin/post-atelier/new` | 新規投稿案作成 |
| `/admin/post-atelier/[id]` | 投稿案編集 |
| `/admin/post-atelier/posts` | 投稿一覧（ステータス・投稿先で絞り込み） |
| `/admin/post-atelier/calendar` | 月別予定一覧（`scheduledDate` 基準） |
| `/admin` | 既存管理者ページにリンク 1 行追加 |

**開発用確認ハブ**（`npm run dev` のみ・本番ビルドでは 404）:

| ルート | 内容 |
|--------|------|
| `/preview/post-atelier` | Simple Browser 用。DB 接続確認・ログイン導線・各画面リンク・チェックリスト |

### 2.2 認証

- 画面: `getViewerEmailFromCookie()` + `isAdminEmail()` → 非 admin は `notFound()`
- Server Actions: 未ログイン → `/login?returnTo=...`、非 admin → `/orders`
- 既存 `src/lib/admin/access.ts` パターンに準拠
- 専用 REST API は**未作成**（Server Actions のみ）

### 2.3 投稿案で扱う項目

| フィールド | 説明 |
|------------|------|
| theme | テーマ・企画名 |
| companionType | 伴走キャラ（`src/lib/journal/meta.ts` の `companionOptions` を再利用） |
| platform | 投稿先（instagram / x / threads / facebook / note / other） |
| scheduledDate | 予定投稿日 `YYYY-MM-DD`（空欄可） |
| todayNumber | **投稿予定日のユニバーサルデイ（UD）**。自動計算・DB 保存 |
| bodyText | 投稿文案 |
| hashtags | ハッシュタグ |
| imageMemo | 画像メモ（素材案など） |
| linkUrl | リンク URL |
| internalMemo | 運用メモ（非公開） |
| status | draft / ready / scheduled / posted / archived |
| authorEmail | 最終更新した管理者メール |

### 2.4 操作

- **新規作成・保存・編集**（Server Actions）
- **テンプレ仮生成**（外部 AI なし。固定テンプレ＋数秘辞書から文案を埋める）
- **投稿文コピー**（文案 + ハッシュタグ + リンクをクリップボードへ）
- **ステータス変更**（フォーム内セレクト → 保存）

### 2.5 キャラ ID（指示書 ↔ コード）

| 表示名 | id |
|--------|-----|
| フクロウ先生 | owl |
| ハリネズミくん | hedgehog |
| リスくん | squirrel |
| ケロシオン | frog |
| ナマケモノくん | sloth |

---

## 3. DB

### 3.1 追加テーブル

**`SocialPostDraft`** のみ（新規。既存テーブルへの破壊的変更なし）

### 3.2 未作成（将来用）

- **`SocialPostTemplate`**: schema コメントで設計予約のみ。`SocialPostDraft.templateId` カラムあり（MVP 未使用）

### 3.3 migration

```
prisma/migrations/20260624120000_social_post_draft/migration.sql
```

ローカルでは `npm run db:local:sync` で適用済み。本番はデプロイ時に `prisma migrate deploy` 想定。

---

## 4. ユニバーサルデイ（UD）計算 — 実装済み

### 4.1 方針

- **「今日」ではなく投稿予定日（`scheduledDate`）** から算出
- 日記の**パーソナルデイ**（生年月日依存）とは別物
- 手入力は廃止。画面表示・保存・テンプレ仮生成はすべて自動

### 4.2 計算式（BambooNOOK 仕様に合わせて修正済み）

月・日は **2 桁の十の位・一の位を分けて足す**（`24` を一括で `+24` しない）。

| 段階 | 式 |
|------|-----|
| ユニバーサルイヤー (UY) | 西暦年の各桁を足して 1 桁まで縮約 |
| ユニバーサルマンス (UM) | UY + 月の各桁（例: 6月 → 0+6、10月 → 1+0）→ 縮約 |
| ユニバーサルデイ (UD) | UM + 日の各桁（例: 24日 → 2+4）→ 縮約 |

**例: 2026-06-24**

```
UY: 2026 → 1
UM: 1 + 0 + 6 → 7
UD: 7 + 2 + 4 = 13 → 1 + 3 = 4
```

画面の内訳表示例: `UY 1 + 月 6 → UM 7 + 日 2 + 4 → UD 4`

縮約ルール: `reducePersonalCycleNumber`（11/22/33 は残さない。パーソナルサイクルと同型）

### 4.3 実装ファイル

| ファイル | 役割 |
|----------|------|
| `src/lib/numerology/universalYearMonthDay.ts` | UY / UM / UD 計算本体 |
| `src/lib/numerology/universalYearMonthDay.test.ts` | 単体テスト |
| `src/lib/admin/post-atelier/universalDayForScheduledDate.ts` | 予定日文字列 → UD |
| `src/lib/admin/post-atelier/validation.ts` | 保存時にサーバー側で UD 再計算 |

### 4.4 辞書の再利用

テンプレ仮生成の UD 説明文に `src/lib/journal/numerologyNumberMeanings.ts`（1〜9 辞書）を使用。

---

## 5. ファイル一覧（投稿アトリエ関連）

```
prisma/schema.prisma                                    # SocialPostDraft モデル
prisma/migrations/20260624120000_social_post_draft/

src/app/admin/post-atelier/
  page.tsx          # トップ
  new/page.tsx      # 新規
  [id]/page.tsx     # 編集
  posts/page.tsx    # 一覧
  calendar/page.tsx # カレンダー
  actions.ts        # create / update Server Actions

src/app/preview/post-atelier/page.tsx                 # 開発用確認ハブ

src/components/admin/post-atelier/
  PostAtelierDraftForm.tsx                            # フォーム + コピー + 仮生成

src/lib/admin/post-atelier/
  types.ts
  validation.ts
  queries.ts
  generateTemplateDraft.ts
  universalDayForScheduledDate.ts

src/lib/numerology/
  universalYearMonthDay.ts
  universalYearMonthDay.test.ts

src/app/admin/page.tsx                                # リンク 1 行のみ変更
```

---

## 6. 未実装・データ待ち・次段階の話

### 6.1 指示書どおり未着手

| 項目 | 状態 |
|------|------|
| `/admin/post-atelier/templates` | 未作成 |
| `SocialPostTemplate` テーブル | 未作成（設計予約のみ） |
| 外部 AI 生成 | 不要（MVP 方針） |
| SNS API / 自動投稿 | 不要（MVP 方針） |
| ユニバーサル数字の専用コンテンツデータ | ユーザー提供待ち（UD 計算のみ実装済み） |
| お守りカラー・LP 別投稿文の本格連携 | 未実装 |
| 他キャラ原稿（`commentPersonalDayActivityDraftByCompanion.pending.ts`） | 本番未実装・触っていない |

### 6.2 ユーザーが次に希望している機能（会話ベース・未実装）

**画像合成・一括ダウンロード**（Instagram 手動投稿用）:

- 用意済みテンプレ PNG に「今日のすうじ」＋コメントを載せる（日記印刷ページと同型の仕組み）
- ライフパス 1〜9 ごとの画像も同様に生成
- PNG をまとめてダウンロード → 運営者が Instagram に手動投稿

技術的には `DiaryBookEntryV2PreviewPage` / `diaryBookEntryPrintLayout.ts` のパターンを SNS 用テンプレ・座標で流用可能。**Step 2 以降の候補**。

着手前に要決定: 画像サイズ（1:1 / 4:5）、1 日あたりの枚数構成、SNS 専用テンプレ素材の有無。

### 6.3 本番反映

- **commit / push は未実施**（ユーザー依頼待ち）
- 反映時: migration `20260624120000_social_post_draft` が本番 DB に適用される

---

## 7. 触っていないもの（重要）

以下は**変更なし**（投稿アトリエ専用チャットの方針）:

- 日記保存・鑑定書・製本 PDF・本棚・プロフィール・解約
- 既存数秘コア計算（`compute.ts` のライフパス等）
- 既存日記コメント生成（`comment*.ts`）
- 他キャラ `pending.ts`

### 補足: ライフパス計算について

ユーザー確認済み。ライフパスは **YYYYMMDD 8 桁の各桁を一括で足す**方式（例: 1950-11-25 → `1+9+5+0+1+1+2+5`）。`11` や `25` をそのまま足す方式ではない。投稿アトリエの UD 計算とは別ルール。

---

## 8. ローカル確認手順

```bash
npm run db:local:up
npm run db:local:sync    # migration 適用
npm run dev
```

1. 管理者でログイン（`ADMIN_EMAILS` または DB `isAdmin`）
2. `/preview/post-atelier` または `/admin/post-atelier`
3. 新規作成 → 予定日入力 → UD 自動表示 → 保存 → コピー → 一覧・カレンダー確認

---

## 9. チャッピーくんへの依頼整理用メモ

### 完了とみなしてよいこと

- Step 1 MVP（台帳 + 仮生成 + コピー + ステータス + UD 自動計算）
- ルート `/admin/post-atelier` 確定
- 非 admin は `notFound()`

### 次の判断・依頼候補

1. **本番反映**のタイミング（「本番反映お願いします」で commit + push）
2. **Step 2**: 画像合成 1 枚プレビュー + PNG ダウンロード
3. **Step 3**: LP 1〜9 一括生成 + ZIP
4. **データ提供**: ユニバーサル数字用コンテンツ、SNS テンプレ PNG、LP 別文案
5. **templates ルート**の優先度

### 別チャットで進めるもの

- 他キャラ原稿 pending 追記
- 日記ブック・製本・LJD 本体の修正

---

## 10. 用語対応

| ユーザー向け表現 | 実装上の呼び方 |
|------------------|----------------|
| 今日のすうじ（SNS 共通） | ユニバーサルデイ（UD） |
| 投稿予定日の数字 | `scheduledDate` → `todayNumber`（DB カラム名は歴史的に todayNumber） |
| 日記の今日の数字 | パーソナルデイ（別ロジック・未連携） |

---

*この資料は Cursor 実装チャットの現状に基づく。コードと齟齬があればリポジトリの実ファイルを正とする。*
