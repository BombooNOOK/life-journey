/**
 * Life Journey Diary｜森のお引越し便・あしあと小包 仕様
 *
 * Status: Pre-Implementation Package Architecture / Source of Truth
 * Updated: 2026-08-10
 * Baseline main: 4f28de2974967ae2fad0400b5e8eeab9703f3833
 * Scope: 設計のみ。実装・DB変更・Capacitor移植は含まない。
 */

# Life Journey Diary｜森のお引越し便・あしあと小包 仕様

**Status:** Pre-Implementation Package Architecture / Source of Truth  
**親方針:** `ljd-local-first-and-moving-policy.md`／`ljd-product-worldview-source-of-truth.md`／`ljd-account-resident-terminology-spec.md`  
**ラベル:** **FACT**＝現行コード実測／**OS仕様**＝公式一次資料／**製品判断**＝本Phase採用／**未決**＝後続

---

## 1. 目的

森のお引越し便は、Local-first 化した人生記録を、機種変更・故障・紛失から守る**第二防衛線**である。

第一防衛線（OS標準移行）は最大限活かすが、LJDとして「必ず全部移る」とは保証しない（親方針）。

あしあと小包は、

> 人間が中身を読むためのファイルではなく、**LJDへ森を復元するための専用パッケージ**

である。将来の「人間可読な長期保存用書き出し」とは**別機能**とする。

標語との関係:

- 端末は変わっても、森はそのまま。  
- 人生の記録は、まず本人の手元にある。  
- 運営が変わっても、あなたのあしあとはあなたのもの。

運営クラウドの「森のお預かり棚」は本仕様の前提にしない。ユーザー自身の保存先だけで成立すること。

---

## 2. ユーザー体験（技術語を出さない）

### 2.1 旧端末

1. **森のお引越し便をつくる**  
2. LJDが自動で荷物をまとめる（進捗は穏やかに）  
3. **保存先を選ぶ**（Files / Drive / PC 等）

### 2.2 新端末

1. **森のお引越し便を受け取る**  
2. 保存してある小包を選ぶ  
3. LJDが確認・復元  
4. 以前の森での暮らしが戻る

UI・ヘルプで極力使わない語: export / import / upload / download / ZIP / manifest / schema / checksum（内部実装・開発者文書専用）。

代わりの語例（コピー未確定・世界観調整可）:

| 内側 | ユーザー向け例 |
| --- | --- |
| create package | お引越し便をつくる／あしあと小包をつくる |
| choose destination | 保存する場所を選ぶ |
| open package | あしあと小包を受け取る |
| validate | 小包のようすを確かめる |
| restore | 森にもどす／受け取る |

---

## 3. 守るデータ分類

### 3.1 A｜必ず小包に入れる（製品判断）

端末原本で、失うと再取得できないもの。

| データ | 理由 |
| --- | --- |
| あしあと本文 | 人生記録の中核 |
| あしあと写真（LJD保存の表示用／processed） | 思い出実体。サーバー恒久保管を前提にしない |
| あしあと下書き | 通信断・途中保存の本人資産 |
| タグ・整理情報（あしあと／ブックに属するもの） | 整理の一部 |
| あしあとブック／本棚メタ（端末原本化後） | 振り返り体験に必要。本文はエントリ参照 |
| 森ログカード完成画像 | 再会の中核・現行消失リスク高 |
| 森ログムービー完成品 | 同上・容量大だが必須 |
| 森の映写便り完成品 | 同上 |
| 森の映写便り下書き（§4） | 制作途中の完成手前資産。扱いは完成品と分けて同梱方針を明記 |
| アルバム構成・並び・カバー | media 参照構造。欠けると空洞化 |
| 森ログ caption / bgmId 等 media meta | 作品と不可分 |
| package 内論理ID・imported履歴に必要な参照 | 二重復元防止 |

ユーザー実測（作業メモ／製品側提示・**コード外実測として記録**）: 森ログカードおおよそ **2MB**、ムービーおおよそ **5MB** 級の事例あり。長期では数百〜数千件・数GB級になり得る（§11）。

### 3.2 B｜入れることを検討（製品判断・初期は任意または段階導入）

| データ | 提案 | 理由 |
| --- | --- | --- |
| お庭 | **v1で入れる候補（推奨寄り）** | device-primary候補。件数が小さく小包圧迫しにくい |
| 読書フォント等の表示設定 | 任意 | 再設定コスト低。無くても森は戻る |
| ログハウス見た目tips類 | 原則入れない／任意 | 人生記録ではない |
| 鑑定の入力＋計算結果JSON（PDFなし） | **入れる候補** | 再読・再PDF生成の種。PDF本体は入れない |
| companion preference | 任意 | device-globalな好み |

**初期パッケージ v1 推奨セット:** A全部 ＋ お庭（可能なら）＋ 鑑定入力/結果JSON（PDF除外）。表示設定は後回し可。

### 3.3 C｜小包に入れない（製品判断・理由確定）

| データ | 入れない理由 |
| --- | --- |
| Firebase認証／ログインセッション | 再ログインで再構築。漏洩危険。引越し対象外 |
| email平文 | 誤配・漏洩面。owner bindingは疑名化（§8） |
| どんぐり台帳 | server-primary。改ざん耐性必須。小包に入れてもサーバ正と矛盾 |
| 決済情報・購入履歴・Stripe ID | 法務・不正防止。端末パッケージに載せない |
| 製本注文・進捗 | 運営フロー正本がサーバー |
| 運営ポスト本文の配信マスタ | サーバー発信。既読は任意キャッシュ扱い |
| 問い合わせスレッド | 運営対応正本がサーバー |
| 管理者データ | 対象外 |
| 鑑定フルPDF（preview/print） | 再生成可能な巨大派生物（§5） |
| SNS投稿合成画像 | オンデマンド再生成可 |
| Cache／temporary／WIP incomplete package | 完成品と混ぜない（§12） |
| アプリ同梱BGMファイル本体 | バンドル資産。metaの bgmId のみ |

---

## 4. 元写真・元動画の扱い（製品判断）

### 4.1 原則

| 対象 | 小包 |
| --- | --- |
| **完成した森ログ作品**（カードPNG／完成MP4／映写完成品） | **入れる** |
| **ユーザー Photos 等に残る元素材** | **無条件には入れない** |
| あしあと写真 | LJDが保持する **processed 表示用** を入れる（現行「あしあとのバックアップ」と同趣旨）。原寸クロップ前源は現行方針どおり非保存なら小包にも無い |

理由: 容量・元素材は写真ライブラリ側・LJD内作品保護が主目的。

### 4.2 映写便り下書きの例外整理

| 状態 | 小包方針 |
| --- | --- |
| 下書きmetaのみ（タイトル・bgm・寸法） | 入れる（小さい） |
| 下書き用に取り込んだ **編集中クリップ／poster（LJDがIDB等へ持っている分）** | **入れる**（これが無いと編集継続不可。装置内コピー＝作品途中） |
| Photosにしかない元フル動画への参照だけ | Photos側の責任。小包にフル原本を強制しない |
| 課金確定後の完成映写 | A扱い（完成品） |

下書き復元後、元素材が端末ライブラリから消えていれば「続きの再編集ができない」旨を穏やかに伝える（コピーはPhase3）。

---

## 5. 鑑定／PDF

### 5.1 分離

| 層 | 小包 |
| --- | --- |
| 入力人物情報 | B: JSONとして入れる候補 |
| numerology計算結果 | B: 入れる候補 |
| 読み解きに必要な参照キー／本文データ | B: 入れる候補（再読用） |
| **PDFバイナリ** | **C: 原則入れない** |
| 製本注文 | C |

### 5.2 容量（FACT・区別）

| 観測 | 値 | 注意 |
| --- | --- | --- |
| `sample-booklet-low.pdf` | **約10.46 MiB** | 同梱サンプル冊子。本番Order実測ではない |
| `src/components/pdf/assets` 素材一式 | **約126 MiB** | 生成用フォント・ガイドPNG等。**ユーザー小包とは無関係** |
| 現行あしあとZIP上限 | 100 MiB | `JOURNAL_BACKUP_MAX_ZIP_BYTES` |

**製品判断:** 毎回PDFを小包へ入れない。オフライン再読は「端末にキャッシュした直近PDF」または「結果JSON＋将来の端末側再レンダ」で足りる。製本用高画質はオンライン再生成。

---

## 6. パッケージ構造

### 6.1 外観

ユーザーには **一つのあしあと小包** に見えること（単一ファイルまたは単一コンテナ）。  
内部名候補（未確定）: `LifeJourneyDiary-Move-YYYYMMDD.ljdpack`（拡張は任意・MIME登録は後続）。

コンテナ技術候補（未決・実装時選定）:

- 単一アーカイブ（ZIP系）＋暗号化レイヤ  
- または単一ファイルにチャンク連結（分割でもUIは1つに見せる）

**製品判断:** UXは1小包。内部が分割でも「小包フォルダを選ぶ」のではなく、可能ならマニフェスト付き単一オブジェクトを優先。止むを得ず分割するときは OSが一塊に扱えるフォルダ＋入口ファイル（未決）。

### 6.2 内部レイアウト案（製品判断）

```
ashiato-parcel/
  MANIFEST.json          # 平文または軽量ヘッダ（最小・版・完全性マーカ）
  OWNER.json             # 疑名バインディング（PII最小化）
  payload/               # 暗号化ブロブまたは平文ステージ（開発時）
    journal/
      entries.jsonl
      photos/{stableId}.*
      drafts.jsonl
    morilog/
      media-index.json
      blobs/{stableId}.*
      albums.json
      device-movie-drafts/
    bookshelf/
      diary-books.json
      bookshelf-books.json
    garden/                # B
      state.json
    appraisal/             # B・PDFなし
      orders-lite.json
  hashes.json            # 各ファイルSHA-256
  COMPLETE               # 空ファイルまたは署名付き完了トークン
```

現行バックアップ（FACT）: `backup.json` + `photos/` のZIP。本小包はそれを**拡張した兄弟**だが、森ログ含む・暗号化前提・restore自己提供を目指す点で別物。

### 6.3 Manifest JSON schema 案（未実装・案）

```json
{
  "$comment": "Life Journey Diary Ashiato Parcel Manifest v1 (draft)",
  "format": "life-journey-ashiato-parcel",
  "schemaVersion": 1,
  "packageVersion": "2026.08.10",
  "packageId": "ulid-or-uuid",
  "createdAt": "2026-08-10T09:00:00.000Z",
  "appVersion": "x.y.z",
  "platform": "ios|android|web-dev",
  "encryption": {
    "scheme": "none|parcel-v1",
    "kdf": "argon2id|pbkdf2|none",
    "wrap": "recovery-code|keychain-assisted|password-optional"
  },
  "ownerBinding": {
    "method": "resident-number-hmac|account-pseudonym",
    "residentNumberFingerprint": "hex",
    "accountPseudonym": "hex",
    "bindingVersion": 1
  },
  "counts": {
    "journalEntries": 0,
    "journalPhotos": 0,
    "moriLogMedia": 0,
    "albums": 0,
    "drafts": 0
  },
  "sizes": {
    "totalUncompressedBytes": 0,
    "totalPackageBytes": 0
  },
  "indexes": {
    "mediaIndexPath": "payload/morilog/media-index.json",
    "hashesPath": "hashes.json"
  },
  "legacyProfileHints": [
    { "partitionKey": "internal-only", "note": "not shown to users" }
  ],
  "completeness": {
    "status": "complete",
    "completeMarker": "COMPLETE"
  },
  "generator": {
    "engine": "moving-package",
    "compatibleBackupFormatHints": ["life-journey-diary-backup@1"]
  }
}
```

`schemaVersion` は破格変更時に上げる。`packageVersion` はアプリ側セマンティクス。`packageId` は同一小包の再読込検出に使う。

---

## 7. profileId 問題

### 7.1 原則（製品判断）

ユーザー向けに Profile 概念を復活させない。

小包内の正は **logical owner（住民／アカウント疑名）＋ item stable IDs**。  
内部 `profileId` は **hint／移行互換メタ** としてのみ残し、復元先の絶対条件にしない。

### 7.2 復元マッピング

| 状況 | 方針 |
| --- | --- |
| 一般ユーザー・default partition 1件 | 新端末の default 内部partitionへ全項目を map |
| admin 複数枠互換 | partition hint があれば対応枠へ。無ければ案内のうえ default（Phase3 UI） |
| profileId が変わった将来 | stable item ID＋owner bindingで合流。旧IDは aliases 配列に保持可 |

Entries/media には `stableId`（作成時ULID等）を必須化。現行 cuid を初回migrate時に stableId として固定してよい。

---

## 8. 同一住民確認（owner binding）

### 8.1 要件

- 他人の小包を誤って自分の森へ入れない  
- email 平文を小包に保存しない  
- サービス終了後も可能な限り本人が開ける（運営専有鍵に依存しない）

### 8.2 候補比較

| 方式 | 安全性 | サービス終了後 | 評価 |
| --- | --- | --- | --- |
| email平文 | 低（漏洩） | 可読だが危険 | **不採用** |
| 住民番号平文 | 中 | 可 | 番号単独だと推測・照会リスク。**平文保存は避ける** |
| 住民番号の salted fingerprint（HMAC） | 高寄り | 塩が端末／小包にある必要 | **推奨要素** |
| アカウント疑名ID（サーバ発行・端末保存の不変ID） | 高 | サーバ死んでも指紋照合はローカル可 | **推奨要素** |
| サーバオンライン検証のみ | 高（運営時） | **運営終了で破綻** | 補助のみ。必須にしない |
| ローカルパスフレーズ | 中〜高 | 可 | パスワード忘れリスク（§9） |
| 復元コード | 中〜高 | 可（コードを本人が保管） | **推奨コア** |

### 8.3 推奨（複合・製品判断）

1. 小包に `accountPseudonym` ＋ `residentNumberFingerprint`（平文番号なし）  
2. 受け取り時: いま森に入っている住民の指紋と照合  
3. 不一致なら拒否（他人の小包）  
4. オフラインのみ・指紋を端末が持たない初回などは、**復元コード**で開錠＋紐付け（オンラインで住民照合できるなら追加確認）  
5. サーバ検証は「できればやる」補助。必須依存にしない  

これで「運営がなくても、コードと小包があれば手元復元」と、「通常時は他人誤復元防止」を両立する。

---

## 9. 暗号化

最終仕様では暗号化を**前提候補**とする（人生記録のため）。現行あしあとZIPは非暗号化（FACT）だが最終形ではない。

### 9.1 方式比較

| 案 | 機種変更 | 水没 | サービス終了 | 別OS | 操作負荷 | 鍵紛失 | セキュリティ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A ユーザーPW必須 | 可（覚えていれば） | 可 | 可 | 可 | 高 | **復元不能リスク大** | 高 |
| B 運営のみ鍵 | 可 | 可 | **破綻** | 可 | 低 | 運営依存 | 運営信頼必須 → SoT矛盾 |
| C Keychain/端末鍵のみ | OS移行で移る場合あり | **端末死で喪失** | 可（ファイルは残るが鍵死） | 弱い | 低 | 高 | 端末盗取に強い |
| D 復元コード | 可（コード保管が条件） | 可 | 可 | 可 | 中 | コード紛失リスク | 高 |
| E 複合 | 最良バランス | コード／新コード再発行設計次第 | 可 | 可 | 中 | 分散 | 高 |

### 9.2 推奨（製品判断・最終決定ではない）

**E 複合:**

1. 小包ペイロードは対称暗号（例: AES-256-GCM）  
2. データ鍵を次で wrap（複数）:  
   - **復元コード**（ユーザーが一度だけ表示→紙／パスマネージャへ。運営非保持理想）  
   - （任意）端末 Keychain にラップして「同じ端末での再作成」を楽に  
   - （任意）覚えやすいPWは追加ラップ。**必須にしない**  
3. 運営は復号鍵を持たない（B禁止）  
4. サービス終了後: 復元コード＋アプリ（または将来の OSS／可読export）で開ける設計を目指す  

パスワード忘れ＝即不能を避けるため、**必須PW（A単独）は非推奨**。

---

## 10. 「運営がなくなっても」

- 小包はユーザー所有ストレージへ  
- 鍵は運営専有にしない（§9）  
- LJD専用復元形式と、将来の**人間可読export**を分離（親SoT）  
- オンライン検証無しでも、binding＋復元コードで開けるパスを残す  

---

## 11. 大容量対応

### 11.1 規模感

- 事例: カード〜2MB、ムービー〜5MB（製品側提示）  
- 200ムービー×5MB ≈ 1GB。あしあと写真・下書き映写を足すと数GB級があり得る  

### 11.2 戦略（製品判断）

| 課題 | 方針 |
| --- | --- |
| 全量1ファイル | UX上は1小包。実装はストリーミング書込必須 |
| 分割 | 不可避なら `part-000`＋マニフェスト。UIは「小包」単数に見せる／受け取りは入口ファイル指定 |
| streaming write | 一時領域へ順次書き、最後に finalize |
| 二重容量 | 原本＋temporary＋完成品が並存し得る → 作成前に空き容量見積（1.5〜2×目安）を案内 |
| 中断 | §12 incomplete を完成扱いにしない |
| iOS Share/export | 大ファイルは一旦App一時→ Document Picker export（OS仕様）。メモリ一括禁止 |
| Android SAF | `ACTION_CREATE_DOCUMENT` で逐次write（OS仕様） |
| FAT32 | 単一ファイル4GB超に注意。分割またはexFAT前提の案内（未決） |
| Drive | ユーザー側クォータ・モバイル通信はOS/サービス依存。LJDは保証しない |

あしあと保険ZIPの100MiB上限（FACT）は**お引越し便には適用しない**（別上限をPhase実装時に再設定。未決だがGB級を想定）。

---

## 12. 荷造り失敗時の安全性

推奨パイプライン（製品判断）:

```
estimate space
→ create TEMP package dir (incomplete)
→ stream write payload
→ write hashes.json
→ verify hashes
→ write MANIFEST completeness=complete + COMPLETE marker
→ fsync
→ promote TEMP → final package file
→ only then offer「保存先を選ぶ」
→ delete TEMP
```

規則:

- `COMPLETE` 無し／hash不一致 → **受け取っても復元開始しない**（壊れた小包）  
- OS kill・電池切れ・容量不足・Drive切断は TEMP破棄または「未完成」明示  
- ユーザー向け: 「まだできあがっていないお引越し便です」  

---

## 13. 復元の原子性（two-phase）

```
小包選択
→ schemaVersion 可読性確認
→ COMPLETE + checksum
→ 一時展開（sandbox staging）
→ owner binding / 復元コード
→ データ検証（必須フィールド・参照整合）
→ 重複プレビュー（§14–15）
→ ユーザー確認（guided）
→ commit to formal store（成功時のみ）
→ staging 削除
```

途中失敗: staging破棄、**現在の森は変更しない**。  
commit は可能な限りトランザクション的（DB＋ファイルの順序定義はPhase3）。

---

## 14. 新端末に既存データがある場合

比較:

| 方式 | 内容 | 評価 |
| --- | --- | --- |
| replace | 現在を小包で置換 | 破壊的。黙って不可 |
| merge | 自動統合 | 衝突の黙殺リスク |
| **guided merge** | 件数・重複・衝突を見せて選ばせる | **第一候補** |

**推奨（製品判断）:** guided merge。

例UI方針（Phase3詳細）:

- 「いまの森にも記録があります。小包の思い出を合わせますか？」  
- 重複はスキップ既定  
- 衝突（同IDで中身差）は個別または「小包側／いまの森側」  
- **全置換**は別の明確な危険操作（二重確認）にし、既定にしない  

---

## 15. 重複判定

| 鍵 | 用途 |
| --- | --- |
| `packageId` | 同一小包の再読込履歴 |
| `stableId`（journal/media/album） | 項目同一性 |
| content hash（任意） | ID無しレガシー混入時の補助 |
| `importedPackageIds[]`（端末） | 履歴 |

同一 `packageId` 再読: 「このお引越し便は以前受け取り済み」→ 差分のみ or スキップ。  
同一 stableId: スキップ既定（二重の思い出を増やさない）。

---

## 16. バージョン互換

| 要素 | 方針 |
| --- | --- |
| `schemaVersion` | 整数。リーダーは N と N-k を読めるよう migration reader |
| backward compatibility | **古い小包を捨てない**。読めない場合も「保管は続けて」と案内 |
| unsupported | アプリ更新を促す。データを消さない |
| 前方互換 | 未知フィールド無視 |
| 5–10年 | 最低限 journal + media blobs + albums の読み取り経路を維持 |

現行 `life-journey-diary-backup` v1 は**入力変換リード**（保険ZIP→小包論理モデル）を将来検討（共通化§18）。お引越し便の主形式とは別 format 名。

---

## 17. OS／保存先UX

ユーザーは保存先を選ぶだけ。クラウド操作の専門知識を要求しない。

### 17.1 iOS（OS仕様）

- `UIDocumentPickerViewController` の export（`forExporting` / ExportToService）で、完成小包をユーザー選択先へコピー  
- 受け取りは open/import 系ピッカーで小包を選択  
- 行き先例: iCloud Drive、Files 上の他プロバイダ、On My iPhone 等（ユーザー環境依存）

出典: Apple Document Picker／`UIDocumentPickerViewController` 公式ドキュメント。

### 17.2 Android（OS仕様）

- 保存: `Intent.ACTION_CREATE_DOCUMENT`（SAF）で表示名・MIMEを渡し、返った URI へストリーム書込  
- 受取: `ACTION_OPEN_DOCUMENT`  
- Google Drive / OneDrive 等は DocumentsProvider 経由でピッカーに現れ得る  

出典: Android Developers「Access documents and other files from shared storage」「Open files using the Storage Access Framework」。

### 17.3 保存先の可能性（製品判断）

iCloud Drive / Google Drive / OneDrive / Files / PC（ケーブル・共有）/ USB・外部メディア — **ユーザー環境とプロバイダ実装依存**。LJDは到達を保証せず、失敗時は穏やかに再試行を促す。

---

## 18. 「あしあとのバックアップ」との関係

| | あしあとのバックアップ | 森のお引越し便 |
| --- | --- | --- |
| ユーザー入口 | 別のまま（用語SoT） | 別 |
| 目的 | もしもの保険（主にあしあと） | 端末を変えても暮らしを続ける |
| 範囲 | 現行: あしあと系（FACT） | A＋選別B |

**技術共通化（設計・製品判断）:**

将来同一エンジン候補: package writer / hasher / encryptor / media blob packing / validate / staging restore。  
UI・format名（`life-journey-diary-backup` vs `life-journey-ashiato-parcel`）・含むペイロードは分岐。  
本Phaseで統合実装はしない（親方針の案A維持、将来B）。

---

## 19. 作るタイミング（穏やかな案内）

端末指標例（実装時チューニング）:

- 最終小包作成日からの経過（例: 30/90日）  
- 以降の新規あしあと／森ログ件数  
- 増分バイト見積  

コピー例:

> 森の荷物が少し増えました。  
> そろそろ新しいお引越し便をつくっておきませんか？

禁止: 強制モーダル連打、恐怖訴求、機能ロック。

---

## 20. 現行バックアップ実装からの継承メモ（FACT）

参考実装: `journalBackupExport.ts` / `journalBackupValidate.ts` / `journalBackupRestore.ts`

| 継承してよい着想 | 踏まない点 |
| --- | --- |
| format + formatVersion | 非暗号化のまま最終化 |
| photos 別ファイル＋JSON参照 | 森ログ非対応のまま |
| emailをZIPに入れない検証 | 運営新規Profile強制restore |
| サイズ・件数上限の考え | 100MiBを引越しに流用 |
| photoPolicy processed | — |

---

## 21. 残るセキュリティリスク（開示）

- 復元コードをスクショ共有・クラウド平置きすると第三者復元可能  
- 端末解锁前の攻撃面はOS依存  
- 完成前TEMPの残りカス  
- 大容量小包のユーザー側Drive共有リンク誤公開  
- binding fingerprintの彩虹表耐性は salt 設計次第（実装時強度設計が必要）  
- 可読exportが無い期間は専用形式ロックインが残る（将来機能で緩和）

---

## 22. 未決事項

- 最終ファイル拡張子／UTI／MIME  
- 暗号ライブラリ・復元コード桁・再発行フロー  
- 分割閾値（単一ファイル最大）  
- お庭・鑑定JSONをv1必須にするか  
- admin複数枠の受け取りUI詳細  
- あしあと保険ZIPとのコード共通化スケジュール  
- 本番PDFサイズ実測（参考）  
- Capacitor経由の picker 実装詳細（Phase3）  

---

## 23. 実装禁止の再確認

本ドキュメント作成にあたり、コード・DB・Capacitor・Filesystem・backup実装・UI・本番は変更していない。

---

## 24. 関連ドキュメント更新指針

- 用語SoTの「森のお引越しは別機能」と整合  
- Local-first方針の第二防衛線を本仕様が具体化  
- 端末配置・復元UXは `ljd-device-storage-and-restore-spec.md`  
- 人間可読exportは別紙（未作成）  

矛盾時優先: 世界観 → Local-first方針 → **本パッケージ仕様** → 端末保存・復元仕様 → 用語 → コードコメント。
