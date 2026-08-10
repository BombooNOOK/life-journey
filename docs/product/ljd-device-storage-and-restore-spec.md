/**
 * Life Journey Diary｜端末保存・自己復元・オフライン設計
 *
 * Status: Pre-Implementation Hybrid Storage Architecture / Source of Truth
 * Updated: 2026-08-10
 * Baseline main: 79ea1dcf9159c7f8adb6d144b17c137920bab307
 * Scope: 設計のみ。Capacitor移植・SQLite/Filesystem実装・DB/Neon変更は含まない。
 */

# Life Journey Diary｜端末保存・自己復元・オフライン設計

**Status:** Pre-Implementation Hybrid Storage Architecture / Source of Truth  
**親方針:**  
`ljd-product-worldview-source-of-truth.md`／`ljd-local-first-and-moving-policy.md`／`ljd-moving-package-spec.md`／`ljd-account-resident-terminology-spec.md`／`ljd-acorn-monetization-spec.md`  

**ラベル:** **FACT**＝現行コード／**OS仕様**＝公式一次資料／**製品判断**＝本Phase採用／**未決**＝後続

本仕様は「どこに置くか」と「どう戻すか」を一体で扱う。切り離して実装設計しない。

---

## 1. 目的

> 端末は変わっても、森はそのまま。  
> 人生の記録は、まず本人の手元にある。

Hybrid版では人生記録を **device-primary** とする。実装前に次を確定する。

1. 端末のどの永続領域へ置くか（OSバックアップと相性）  
2. オフラインでどう読むか／どう新規あしあとを残すか  
3. あしあと小包からどう荷ほどきするか（自己復元UX）  
4. 失敗時に現在の森を壊さないか  
5. Web版との分岐を作らないか  

**実装は本Phaseでは行わない。**

---

## 2. 保存領域比較（iOS / Android / Capacitor）

出典の要約: Apple File System Basics／Using the file system effectively；Android Auto Backup；Capacitor Filesystem / Preferences / Storage ガイド。

| 領域 | OSバックアップ | Quick Start / D2D | OS削除 | ユーザー可視 | 大容量向き | meta向き | 鍵向き | オフライン | iOS/Android差 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Documents** | 対象（iOS） | 移る期待高 | 低い | 高い（共有可） | ○ | △ | × | ○ | Android Capacitor DocumentsはPublic寄りで制約大 |
| **Application Support / Library** | 対象（Caches除く） | 移る期待高 | 低い | 低い | ○ | ○ | × | ○ | Capacitor `Directory.Library`≈iOS Library |
| **App Data（getFilesDir / Capacitor Data）** | Auto Backup対象側（Android） | D2Dで移る期待 | 低い | 低い | ○ | ○ | × | ○ | Capacitor `Data`は**iOSではDocumentsを使う**（公式注意） |
| **Cache** | **対象外** | 期待薄 | **破棄され得る** | 低 | 一時のみ | ×人生記録 | × | 不安定 | 両方で人生原本禁止 |
| **Preferences** | 通常バックアップ／転送で移り得る | 移る場合あり | アプ削除で消える | 不可視 | **×** | 小設定のみ | △軽量 | ○ | Capacitor公式: **ローカルDB用途禁止** |
| **Keychain / Keystore** | 複雑（属性依存） | iCloud Keychain／暗号化転送依存 | アプ削除で消えることが多い | 不可視 | × | × | **○** | ○ | ThisDeviceOnlyは別機復元弱い |
| **Filesystem API** | ディレクトリ依存 | ディレクトリ依存 | 同上 | 同上 | ○（blob/URI利用） | ○ | × | ○ | base64一括読込は避ける（大容量） |
| **WebView IndexedDB** | **人生原本の根拠にしない**（除外・不確実） | **保証不可** | サイトデータ消去で消える | 不可視 | 現状利用あるが非推奨 | 暫定 | × | ○だが危険 | Hybrid最終形にしない |
| **WebView localStorage** | 同上／OSが消す可能性（Capacitor明記） | 保証不可 | 消去されやすい | 不可視 | × | フラグ程度 | × | 不安定 | Preferencesへ移行推奨（軽量のみ） |

**製品判断:** 人生記録の正は **ネイティブ永続ファイル＋SQLite**。WebView IDB/LSを最終原本にしない。Cache禁止。Preferencesは大量人生DBに使わない。

---

## 3. データごとの物理配置案（製品判断）

| データ | 推奨配置 | 形式 |
| --- | --- | --- |
| あしあと本文・タグ・日付・気分等 | **Local DB（SQLite）** | 行＋索引 |
| あしあと写真 | **Filesystem media dir** + DBに path/hash/size | ファイル；DBはBlobしない |
| あしあと下書き | SQLite（draft表）＋写真はmedia dir | 同上 |
| 本棚／あしあとブックメタ | SQLite | |
| 森ログ完成画像/MP4 | **Filesystem `media/morilog/`** + media_index表 | path参照 |
| 映写完成／下書きクリップ | 同上 `media/device-movie/` | |
| アルバム・caption・bgmId | SQLite（アルバム／media meta） | JSON列は補助的に可 |
| お庭候補 | SQLite | 件数小 |
| 鑑定オフライン閲覧 | SQLiteに入力＋結果JSON。PDFは任意キャッシュdir（除外候補） | PDFはバックアップ肥大化に注意 |
| UI tips・表示設定 | Preferences | 軽量KVのみ |
| 復元コード関連ラップ鍵・device trust | Keychain/Keystore | 小容量秘密のみ |
| あしあと小包TEMP | Cacheまたは明示TEMP dir（完成前） | COMPLETE後にユーザー保存先へ |

### 推奨ディレクトリ骨格

**iOS（製品判断）**

```
Library/Application Support/<bundle>/ljd/
  db/forest.sqlite
  media/journal/
  media/morilog/
  media/device-movie/
  staging/restore/     # 復元一時
  staging/migrate/     # server→device一時
# Cache は人生原本に使わない
# Documents はユーザーに生ファイルを晒す用途がない限り避け、Supportへ
```

Capacitor写像: メタ＋媒体は `Directory.Library`（または将来 `Library` 明示）優先。`Directory.Data` はiOSでDocuments相当になるため、**人生DBをDataに安易に置かない**（iCloud Documents圧・可視性）。実装選定は未決だが方針は Support/Library。

**Android（製品判断）**

```
getFilesDir()/ljd/
  db/forest.sqlite
  media/...
  staging/...
# getCacheDir / getNoBackupFilesDir に人生原本を置かない
# Auto Backup / D2D 対象側を維持。大容量は小包で補完（25MBクラウド上限FACT）
```

Capacitor: `Directory.Data`（app files）が主。`Directory.Cache`禁止。

---

## 4. Local DB方式比較

| 方式 | 5–10年・数千件 | 検索/タグ | migration | 整合性 | 判定 |
| --- | --- | --- | --- | --- | --- |
| **SQLite** | 強い | SQL索引 | 版付きmigration | トランザクション | **推奨** |
| IndexedDB継続 | WebView寿命リスク | 弱い〜中 | アプリ任せ | 弱い | **最終形不採用** |
| JSON filesのみ | 肥大・部分更新困難 | 自前索引 | 手作業 | 原子性弱い | 小設定・export用補助のみ |
| Preferences | 公式非推奨（大量） | 不可 | 不可 | 不可 | **人生記録に使わない** |

**推奨Local DB:** SQLite（プラグイン選定は実装Phase。Community SQLite等）。暗号化する場合はDBファイル鍵をKeystoreに置く案（未決）。

---

## 5. メディア保存

| 方式 | 評価 |
| --- | --- |
| DB Blobに動画 | **不採用**（肥大・バックアップ・コピーコスト） |
| Filesystemのみ・path記憶なし | 孤児ファイル危険 |
| **Filesystem + DB path管理** | **推奨**（stableId、hash、mime、bytes、相対path） |

表示は `convertFileSrc` + blob/URI（大容量をbase64でWebViewに載せない）。

---

## 6. オフライン動作

### 6.1 通信なしで成立（製品判断）

- 森に入る（trusted device / local unlock後）  
- ログハウスを見る（ローカル状態）  
- 過去のあしあとを読む／写真を見る  
- 森ログ・アルバムを見る  

### 6.2 新しいあしあと（オフライン）とどんぐり

**どんぐり仕様は変更しない**（`ljd-acorn-monetization-spec.md`: 森にあしあとを残す＝3こ。台帳はserver-primary）。

| 段階 | 挙動（製品判断） |
| --- | --- |
| オフライン執筆 | 端末に **下書き相当／未確定あしあと** として保存可（人生を失わない） |
| 「森に残す」確定 | **オンライン必須**。サーバ台帳で3こ消費確定後に「確定済みあしあと」へ昇格 |
| オフライン中の表現 | 「いまは下書きとして手元にあります。通信が戻ったら、どんぐりで森に残せます」等（コピーはPhase実装時） |
| どんぐり不足 | 現行どおり。勝手に無料確定しない |

衝突整理: Local-first＝手元に書ける。経済確定はサーバ。**両立は「未確定ローカル」と「確定エントリ」の二段階**。

### 6.3 オンライン必須（再掲）

鑑定新規、購入、どんぐり確定・獲得、運営ポスト取得、製本、server→device初回移行。

---

## 7. 「森に入る」と認証（オフライン閲覧）

毎回オンラインFirebase必須だとLocal-firstが弱い。

| 方式 | 評価 |
| --- | --- |
| 初回認証後の trusted device | **推奨コア**。端末に信頼印（Keystore） |
| local unlock（端末ロック／生体） | **推奨**。アプリ起動時の開き方 |
| 生体のみ必須 | OS非対応端末がある。フォールバック要 |
| offline grace（期限付き） | 補助可。未決（日数） |
| 完全「森から出る」 | 信頼印を消し、オフライン閲覧も止めるか確認（重大操作） |

**推奨フロー（製品判断）:**

1. 初回: オンラインで森に入る（Firebase）→ この端末を信頼  
2. 以降オフライン: 端末のロック解除＋local unlockで、手元の森を読める  
3. 書き確定・課金系はオンライン再確認  
4. 完全ログアウト: 「この端末の信頼を外す」＝オフラインでも人生記録を開けなくする選択肢を明示（データファイルは残し得るがロック）

セキュリティ: 端末窃盗対策はOSロック前提。紛失時は小包＋復元コードが第二防衛。

---

## 8. 新端末お引越しUX（世界観コピー案）

技術語（export/ZIP/manifest等）は出さない。

1. **森に入る**（住民登録／本人確認）  
2. 「前の森から持ってきた荷物はありますか？」  
   - ある → お引越し便を受け取る  
   - ない → いつもの森として始める／（Webから移すなら）手元の森を用意する導線  
3. 小包を選ぶ（Files等）  
4. 「小包のようすを確かめています」（version・完全性・持ち主）  
5. 「○件のあしあと、○つの森ログ…が入っています」  
6. 「この森に荷ほどきする」  
7. staging → guided merge（必要なら）  
8. 完了  
9. **「おかえりなさい。前の森での暮らしを戻しました。」**

失敗時: 「いまの森はそのままです。小包はまだ開けていません。」  

---

## 9. Guided merge UX（正式第一候補）

新端末に既に記録がある場合、黙って置換しない。

### 見せ方（大量1件確認を強制しない）

要約カード例:

- 小包だけにある記録: N  
- いまの端末だけにある記録: M  
- 同じ思い出（そのまま）: K  
- 内容が食い違います: C（少数のときだけ詳細）  

操作:

- **合わせる（推奨）** — 小包の新規を追加、重複はスキップ  
- 食い違いだけ見る  
- （危険・二重確認）いまの森を小包の内容で入れ替える  

同一stableIdはスキップ既定（二重の思い出を増やさない）。

---

## 10. 復元失敗安全（staging → validate → commit）

```
選択 → schema可読 → COMPLETE/hash
→ staging展開（現行DB/mediaに触れない）
→ 復号・owner確認
→ 検証・重複プレビュー
→ ユーザー確認
→ commit（DB transaction + media move）
→ staging削除
```

容量不足・破損・復号失敗・kill・unsupported: **staging破棄のみ**。現行森不変。  
unsupported: データを消さず「保管は続けて、アプリを更新」等。

---

## 11. 復元コード（鍵紛失リスク最小化）

Phase2推奨の複合暗号化を踏まえ、本Phaseの推奨を具体化（**最終暗号式の固定は未決**）。

| リスク | 緩和 |
| --- | --- |
| コード紛失 | 作成時に「いま書き留める」必須導線。再表示は制限付き。オンライン時のみ「再発行（旧小包は旧コード）」等（未決詳細） |
| 端末故障 | **コードが主**。Keychainのみ依存禁止 |
| iPhone⇄Android | コード＋小包でクロスOS。Keychainは引き継げない前提 |
| Keychain移行 | 補助ラップのみ。ThisDeviceOnlyに人生復旧を賭けない |
| OSバックアップ | ファイル領域は移る期待。鍵はコードで再開錠 |
| サービス終了 | 運営が鍵を持たない。コード＋将来可読export |
| 小包あるが鍵なし | **最悪手:** あしあと保険（非暗号ZIP）併存期間、可読export、コード再発行（本人確認）——優先度はコード保管UX |

**推奨:** 復元コード＝開錠の第一鍵。Keychain＝利便。必須パスワード単独は非推奨。運営専有鍵は禁止。

---

## 12. OS標準移行との関係

| | 期待できる | 保証できない | 除外すべきでない |
| --- | --- | --- | --- |
| **iOS** | Documents/Application Support上のアプリデータがバックアップ／Quick Startで移る期待 | WebView IDB、Cache、ThisDeviceOnly鍵、ユーザー設定オフ | 人生DB・mediaをCacheやbackup除外にしない |
| **Android** | files/DB/SharedPreferencesのD2D。クラウドAuto Backupは**約25MB** | 大容量mediaのクラウド自動完全移行、全OEM差分 | `getNoBackupFilesDir`やcacheに原本を置かない |

製品: OSを第一防衛、**保証はあしあと小包**。

---

## 13. サーバー→端末 初回移行

```
ログイン（Hybrid）
→ 「手元の森を用意しています」
→ device staging
→ メタ全件取得
→ 写真/必要媒体取得（resume可）
→ count + hash検証
→ local SQLite/media構築
→ 検証OKで Local原本化フラグ
→ （任意）お引越し便をすぐ作る案内
```

- 失敗: staging破棄、サーバ正のまま、再試行可  
- **サーバ原本削除時期は決めない**（§17）  
- 移行中フラグでWeb編集方針と連動（§14）

---

## 14. Web版共存（製品判断・第一候補）

**ユーザー確定方針を正式採用する。**

| 状態 | Web |
| --- | --- |
| **Hybrid未移行** | 当面、従来どおり**閲覧・編集可能** |
| **Hybrid移行完了** | 端末が人生記録の原本。**Webは閲覧専用**。あしあと等の編集で端末と分岐させない |
| **十分な移行期間終了後** | Web版全体を原則閲覧専用へ寄せる方向 |

Web案内例（穏やか・実装は後日）:

> この森の記録は現在スマートフォン版で管理されています。  
> 記録を残すときはアプリから森に入ってください。

比較した他案（採用しない第一候補）: 黙ったまま両書き可能なtemporary sync（分岐源）。server mirror常時双方向（Local-firstと緊張）。

**本Phaseでは仕様記載のみ。Web編集停止の実装は行わない。**

---

## 15. 1端末方針（いつもの森）

内部: 1 primary device。ユーザー語は出さない。

| 場面 | 表現例 |
| --- | --- |
| 初回Hybrid | 「このスマートフォンで、いつもの森を育てます」 |
| お引越し完了 | 「いまはこの端末が、いつもの森です」 |
| 別端末で開く | 「別の場所にも森の控えがあります。書き残しは、いつもの森から」 |

同時編集の自動同期は提供しない（親方針）。

---

## 16. 機種変更後の旧端末

両方から編集して分岐させない。

| 状態 | 方針 |
| --- | --- |
| お引越し便の荷ほどき成功後 | 旧端末は **閲覧相当／書き込み停止**。画面に「この森は新しい場所へお引越ししました」 |
| 再びこちらをいつもの森に | 「こちらへ戻す」操作（明示・確認）。オンラインでデバイス印を付け替え（詳細未決） |
| 旧端末データ | すぐ物理削除しない。ロック後、ユーザ意思で小包確認済みなら削除案内可 |

---

## 17. サーバー削除時期についての提案（未決・提案のみ）

削除しない／するの決定は保留。提案の段階案:

1. Hybrid移行＋検証OK＋（推奨）あしあと小包作成確認  
2. 猶予期間（例: 90日）はサーバに読み取り用ミラー残置  
3. 期限後に大容量Blobから段階削除、メタは更に残す選択肢  
4. 法令・問い合わせに必要な最小は別ポリシー  

本仕様は時期を確定しない。

---

## 18. Secure storage まとめ

| 内容 | 置き場 |
| --- | --- |
| DB/ファイル暗号鍵、device trust、セッション補助 | Keychain / Keystore |
| 復元コード | **ユーザーが保持**（紙・パスマネ）。端末にはラッパのみ任意 |
| 人生本文・写真・動画 | Filesystem + SQLite（鍵で保護するならファイル暗号化） |

---

## 19. 未決事項

- SQLiteプラグイン確定・SQL schema初版  
- Capacitor Directory最終マッピング（Library vs Dataの検証ビルド）  
- 鑑定PDFキャッシュをbackup対象にするか  
- offline grace日数、生体フォールバック詳細  
- 復元コード再発行の本人確認フロー  
- Web閲覧専用のAPI拒否実装時期  
- 旧端末ロックのサーバ連携方式  
- 「十分な移行期間」の長さ  

---

## 20. 実装禁止の確認

本ドキュメント作成にあたり、Capacitor移植、SQLite/Filesystem/Preferences/Keychain実装、DB/Prisma、Neon/Blob移行、backup/restore実装、UI実装、本番変更は行っていない。

---

## 21. 関連

- 矛盾時優先: 世界観 → Local-first → 小包仕様 → **本端末保存・復元仕様** → 用語 → どんぐり → コードコメント  
- Phase2小包の staging / guided merge / 暗号複合方針と整合  
