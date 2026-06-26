# 今日のこころ予報 — データ入稿フォーマット（owl / base）

## 優先順位（合意）

| Phase | 内容 |
|-------|------|
| **1** | UD8 × owl × base で投稿テスト（現状）。必要ならご案内・全員集合 CTA ページ追加 |
| **2** | UD1〜9 × owl × base のデータ受け入れ（本ドキュメント） |
| **3** | `isDailyNumberDataReady` をデータ存在判定に変更（当面 owl / base） |
| **4** | キャラ別メッセージ＋ fallback（exact → owl → base） |
| **5** | messageType 拡張（base 運用安定後） |

## 推奨方式：**CSV 入稿 → ビルド時検証 → TS 配列を生成**

| 方式 | メリット | デメリット |
|------|----------|------------|
| **CSV（推奨）** | スプレッドシート編集・108件の一覧・差分確認が容易。日記テンプレと同じ運用 | 取り込みスクリプトが必要 |
| TS 直書き | 型安全・即 import | 108件の diff が読みにくい・非エンジニアが編集しづらい |

**結論:** 原稿は `docs/*.csv` に置き、`npm run daily-number:data:build` で  
`src/lib/admin/post-atelier/daily-number/generated/*.ts` を生成する。  
アプリは生成済み TS を import（ランタイムで CSV を読まない）。

将来キャラ・messageType が増えても、CSV ファイルを分けるか列を増やすだけで拡張できる。

---

## ファイル一覧

| ファイル | 行数 | 内容 |
|----------|------|------|
| `docs/daily-number-today-cover-owl.csv` | 27+ | 表紙文バリアント（UD1〜9 × base A/B/C。季節・特別シーズンは行追加） |
| `docs/daily-number-messages-owl-base.csv` | 324 | 個別メッセージ（UD × LP12 × variant A/B/C） |

`character` / `messageType` は Phase 2 では固定（`owl` / `base`）。列は将来用に残す。

---

## 1. 表紙文 CSV（today cover variants）

**キー:** `todayNumber` + `season` + `specialSeason` + `variant`（ファイル内で一意）

| 列名 | 必須 | 説明 |
|------|------|------|
| `todayNumber` | ○ | 1〜9 |
| `season` | ○ | `base` / `spring` / `summer` / `autumn` / `winter`（未記入は `base`） |
| `specialSeason` | | `new_year` / `new_life` / `obon` / `autumn_night` / `christmas` / `year_end` |
| `variant` | ○ | `A` / `B` / `C` |
| `title` | ○※ | 表紙サブタイトル |
| `summaryMessage` | ○※ | 表紙本文 |
| `colorName` | | おまもりカラー名（**表紙では未使用**。個別ページ用。未記入可） |
| `themeKeywords` | | 内部メモ。`\|` 区切り |
| `toneNotes` | | 内部メモ。`\|` 区切り |
| `avoidNotes` | | 内部メモ。`\|` 区切り |
| `notes` | | 入稿メモ |

※入稿済みとみなす条件（`title` と `summaryMessage` が埋まっていること）

**初期スロット:** UD1〜9 × `season=base` × `variant=A,B,C` の **27行** を必須。  
季節版・特別シーズン版は行を追加する（例: `season=spring`, `specialSeason=new_year`）。

**将来の選択優先順位（実装済み・日付判定は未実装）**

1. `specialSeason` 一致
2. `season` 一致（`base` 以外）
3. `base` + 指定 `variant`（未指定時は A）

## 2. 個別メッセージ CSV

**キー:** `todayNumber` + `lifePathNumber` + `character` + `messageType` + `variant`（324件で一意）

| 列名 | 必須 | 説明 |
|------|------|------|
| `todayNumber` | ○ | 1〜9 |
| `lifePathNumber` | ○ | 1,2,3,4,5,6,7,8,9,11,22,33 |
| `character` | ○ | Phase 2 は `owl` のみ |
| `messageType` | ○ | Phase 2 は `base` のみ |
| `variant` | ○ | `A` / `B` / `C` |
| `colorName` | ○※ | おまもりカラー（LPごと） |
| `body` | ○※ | 個別本文 |
| `action1` | ○※ | おすすめのすごしかた 1件目 |
| `action2` | ○※ | おすすめのすごしかた 2件目 |
| `notes` | | 入稿メモ |

※入稿済み: `colorName` / `body` / `action1` / `action2` がすべて埋まっていること

**自動付与（CSV に書かない）**

- `displayName` / `subtitle` → `PERSONAL_NUMBER_MASTERS` から

`lifePathNumber` の並び（ページ割当）は `pageLayout.ts` の `DAILY_NUMBER_PERSONAL_PAGE_GROUPS` に従う。

---

## 3. コマンド

```bash
# CSV を検証し、generated/*.ts を再生成
npm run daily-number:data:build

# 検証のみ（CI 向け）
npm run daily-number:data:validate
```

---

## 4. 入稿の進め方（Phase 2）

1. まず **cover base A** 9件 + 必要なら **B/C** を埋める
2. **messages 108件** を todayNumber ごとに 12 LP ずつ埋める
3. `npm run daily-number:data:validate` で件数・重複・必須チェック
4. Phase 3 で `isDailyNumberDataReady` を「その組み合わせが 9+108 揃っているか」に切り替え

未入稿の行は `body` を空のままにできる。検証では「入稿済み UD」のみ completeness をチェックするオプションを後から追加可能。

---

## 5. 文字数の目安（画像レイアウト v1 確定値）

| フィールド | 目安 |
|------------|------|
| 表紙 `summaryMessage` | 12文字/行 × 最大6行 |
| 個別 `body`（上段） | 1〜4行目13文字、5行目以降8文字+5文字インデント（最大8行・lineHeight 32） |
| 個別 `body`（下段） | 1〜3行目13文字、4行目10文字+3文字インデント、5行目以降8文字+5文字インデント（最大8行） |
| `action1` / `action2` | 13文字/行、2行まで（・付き） |
