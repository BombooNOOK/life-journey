/**
 * Life Journey Diary｜Local-first データ保護・暗号化方針
 *
 * Status: Current Local Data Security Architecture / Source of Truth
 * Updated: 2026-08-12（4B-3H: capacity Foundation候補。自動暗号化・Local原本化は含まない）
 * Baseline main: 1a8a8b1057bd98c0ceea6e64ec97f6d74e514c41
 * PoC evidence: 4B-3B〜3D on test/ios-local-first-backup-restore @ 2519e23
 * Scope: 設計＋明示呼び出し可能な Foundation。ljd_local_journal の自動暗号化、
 *        bulk migration、Local原本化、お引越し便実装、Firebase変更、Android実装、
 *        App Store提出、Release Gate未了項目のPASS扱いは含まない。
 *
 * 親方針:
 * - docs/product/ljd-product-worldview-source-of-truth.md
 * - docs/product/ljd-local-first-and-moving-policy.md
 * - docs/product/ljd-moving-package-spec.md
 * - docs/product/ljd-device-storage-and-restore-spec.md
 * - docs/hybrid/HYBRID_PHASE_4B2D_LOCAL_FIRST_FOUNDATION.md
 */

# Life Journey Diary｜Local-first データ保護・暗号化方針

**Status:** Current Local Data Security Architecture / Source of Truth  
**ラベル:** **Verified**＝実測済／**Designed**＝採用仕様／**Release Gate**＝未実証（PASS禁止）／**FACT**＝現行コード／**OS仕様**＝一次資料

---

## 0. 最重要思想（壊してはいけない）

> 人生の記録は、まず本人の手元にある。  
> 端末は変わっても、森はそのまま。  
> 運営が変わっても、あなたのあしあとはあなたのもの。

セキュリティは、この所有思想の敵ではなく味方である。

したがって：

1. **運営専有鍵で人生記録を開錠できない設計にしない**（親SoTと一致）
2. **Keychainにしかない鍵で森のお引越し便も開錠する設計にしない**（旧端末水没・削除に耐えない）
3. **「暗号化すればするほど安全」と単純増強しない**（機種変更・Quick Start・Android将来・読込性能を壊し得る）
4. Face ID は **森を開くUX** と **暗号鍵そのもの** を混同しない

---

## 1. 保護対象の分離

| 対象 | 例 | 第一防衛 | 第二防衛 |
| --- | --- | --- | --- |
| SQLite 人生メタ | あしあと本文・tags・日付・LocalJournal / media / migration metadata | OS Data Protection ＋（製品判断）SQLCipher | 森のお引越し便 |
| Filesystem media | 写真・将来の森ログカード／ムービー・映写便り等 | OS sandbox ＋ file protection class | 森のお引越し便 |
| Device key material | Local DB 暗号鍵・将来の media 鍵候補・device trust | Keychain（**ThisDeviceOnlyに復旧を賭けない**） | お引越し便側ラップ／復元コード |
| お引越し便鍵 | 小包ペイロード対称鍵 | **復元コード等・別系統**（`ljd-moving-package-spec.md`） | （本人保管） |

**FACT（4B-3E Foundation）:**  
`ljd_local_journal` は **引き続き `no-encryption`**。media は Library 平文相対 path。一般ユーザー動線からは未実行。  
`capacitor.config` の相対場所は **`Library/Application Support/app.bamboonook.ljd`**（FileManager 実行時解決と一致。絶対pathはhardcodeしない）。  
`iosIsEncryption: true` は plugin secret API を有効化するだけで、既存 journal を自動暗号化しない。

---

## 2. Threat model（要約）

| ID | 脅威 | 主に守る層 | 備考 |
| --- | --- | --- | --- |
| T1 | 端末ロック中の物理抽出 | OS Data Protection | Class C 既定でも「初回unlock後」はメモリ上クラス鍵が残る（OS仕様） |
| T2 | ロック解除済み端末＋アプリサンドボックス外アクセス | OS sandbox | 脱獄・悪性プロファイル等は保証外 |
| T3 | バックアップ／転送先での人生ファイル平文閲覧 | SQLCipher / media 暗号（追加）またはバックアップ経路設計 | OS DPだけでは「別端末に復元されたコンテナ」での閲覧を完全には防げない場合がある |
| T4 | アプリプロセスが動いている間の平文 | アプリ設計・最小保持 | 「使っている間」は必然的に平文に近い |
| T5 | 旧端末水没・紛失で Keychain 死 | **お引越し便＋復元コード** | Keychain単独禁止 |
| T6 | iPhone→Android | お引越し便 | Keychain非継承前提 |
| T7 | 運営・サーバ漏洩 | Local-first／運営非専有鍵 | Neon時代データは別論点 |
| T8 | ログアウト後の共有端末 | ロック方針（§10） | 削除≠既定 |
| T9 | アプリ削除後の残骸鍵 | 起動時整合（orphan secret） | §11 |
| T10 | Quick Startでデータ移って鍵移らず | **鍵の移住属性とOS防衛線を両立** | 最重要事故防止 |

**非目標（このSoTの外側）:** 高度な国家級攻撃、ハードウェア秘密抽出、ユーザーが復元コードをSNSに貼る運用失敗の完全防止。

---

## 3. iOS 標準 Data Protection（OS仕様）

出典: Apple Platform Security — [Data Protection overview](https://support.apple.com/guide/security/data-protection-overview-secf6276da8a/web)、[Data Protection classes](https://support.apple.com/guide/security/data-protection-classes-secb010e978a/web)、[Keychain data protection](https://support.apple.com/guide/security/keychain-data-protection-secb0694df1a/web)。

| Class | API | 挙動（要約） |
| --- | --- | --- |
| A Complete | `NSFileProtectionComplete` | ロック後まもなくクラス鍵破棄。再unlockまで不可 |
| B Unless Open | `NSFileProtectionCompleteUnlessOpen` | ロック中書き込み向け。閉じると以後ロック中に再open不可 |
| C Until First Auth | `NSFileProtectionCompleteUntilFirstUserAuthentication` | **サードパーティ既定**。reboot〜初回unlockまで守れ、以降はロック中も鍵が残る |
| D None | `NSFileProtectionNone` | UIDのみ。高速ワイプ用途。サードパーティ人生原本には不適 |

**OS仕様:** 第三者アプリのファイルは明示しなければ多くの場合 **Class C**。フラッシュ上は常にハードウェアAESで暗号化されるが、**「ロック中に読めない」ことと同一ではない**。

### 3.1 分類：OS標準で十分なもの／追加が要るもの／保留

| 区分 | 内容 |
| --- | --- |
| **OS標準で土台として十分** | サンドボックス分離、未ロック起動直後の保護、ディスク上のハードウェア暗号化、ユーザー未unlock時の一部攻撃面 |
| **LJD独自追加を推奨** | Local SQLite の **アプリケーション層暗号（SQLCipher）**— テキスト人生記録の「コンテナ平文閲覧」耐性をOS DPの上に重ねる |
| **判断保留〜段階導入** | 全mediaのアプリ層ファイル暗号（動画・streamingコスト大）。まず file protection 強化＋高機密mediaのみを検討 |
| **独自で増やすと危険になりやすい** | ThisDeviceOnly Keychainだけでお引越し便やOS復元を担保する、運営専有鍵、ログアウト＝削除の既定化 |

---

## 4. SQLite / SQLCipher / `@capacitor-community/sqlite`

**FACT:** `@capacitor-community/sqlite` ^8.1.1。`ljd_local_journal` は `"no-encryption"`。  
plugin は SQLCipher を iOS/Android で使用。encrypted open 能力は `src/lib/local-first/security/encryptedDatabase.ts` に隔離（明示呼出のみ）。

### 4.1 調査メモ（プラグイン能力）

| 項目 | 内容 |
| --- | --- |
| 暗号実装 | Native: SQLCipher（iOS/Android）。Web: 暗号化非対応 |
| API例 | `setEncryptionSecret` / `changeEncryptionSecret` / `clearEncryptionSecret` / `isDatabaseEncrypted`、接続時 `encrypted: true` と mode |
| 鍵保管 | **Designed 第一候補:** `setEncryptionSecret` → plugin built-in Keychain。**Verified:** `kSecAttrAccessibleWhenUnlocked`（secret本文未取得）。**plugin version 変更時は accessibility を再監査** |
| plaintext → encrypted | **その場で上書き変換は不可／非推奨**。新規暗号化DBを作り copy（SQLCipher `sqlcipher_export` 相当）。完了後に平文を安全削除 |
| key変更 | `changeEncryptionSecret` 系（実装Phaseで検証必須） |
| key紛失 | DBは開けない。**お引越し便で別途復旧**が前提 |
| Cap 8 / SPM | foundationでSPM導入済。community maintenanceリスクは §14 |

### 4.2 SQLite追加暗号化の必要性（製品判断）

**推奨: する（Layer 2）。**  
理由: あしあと本文は検索可能な高機密テキストであり、OS Class Cだけでは「初回unlock後のコンテナダンプ」やバックアップ運用差に対する防衛が薄い。SQLCipherは業界標準アルゴリズムで、親SoTの「DB鍵は Keystore へ」案と一致。

ただし:

- 平文PoC DBは後から **コピー移行で暗号化可能**（段階導入可）
- 鍵を ThisDeviceOnly だけで持つと Quick Start／水没と衝突しうる → §5・§12
- **iOS上の正式DBパス／バックアップ属性は未確定** → §4.3・Phase 4B-3Bで実測決定

### 4.3 正式DB保存場所（Designed: Application Support）

**Designed:** `Library/Application Support/<bundleId>`。絶対pathは FileManager から取得する。

**Verified（dummy / 会社用 SE）:** 配置、encrypted open、backup exclusion=false（LJD include後）、relaunch 維持、Complete 属性維持。

**Release Gate:** OS backup 中身（RG-2）・restore 後 open（RG-3）は未実証。会社端末では restore 禁止のため未実施。

比較済み（PoC）: Documents / CapacitorDatabase 既定は本番第一候補にしない。

### 4.4 初回 production Local-first 化（設計候補・未確定）

現状の actual `ljd_local_journal` は **schema version 1・entries/tags/media 0・実ユーザーデータなし**。

**第一候補（Strategy B / 未確定）:** plaintext の空 DB を in-place / production migration するより、**encrypted Local Journal を fresh bootstrap** し、Server 原本を残したまま検証してから正式 Local DB へ切り替える。

- 空 DB を migration する実益が小さい
- 最初から encrypted 正式構成を作れる
- plaintext→encrypted という余分な production step を減らせる
- 4B-3F/3G の migration engine は **将来の schema / encryption / recovery 用 reference** として feature branch に残す（今回 main 化しない）

**本 Phase では作成・切替しない。** RG-1〜4 は未完のまま。

---

## 5. Keychain 設計（製品判断・第一候補）

端末内 **Local DB 暗号鍵** の第一候補は **Capacitor SQLite built-in encryption secret store**（独自 LJD SecureKeyStore は 4B-3E で削除）。

**Domain層へ iOS Keychain API を直接散らさない。** storage 属性は `ljd-local-security` slim bridge。Android は将来 adapter。

### 5.1 Accessibility 比較

| 属性 | 利便 | 盗取・ロック中 | 機種変更 | 備考 |
| --- | --- | --- | --- | --- |
| **WhenUnlocked**（`kSecAttrAccessibleWhenUnlocked`） | unlock中のみ取得 | **強い**（ロック中不可） | 暗号化バックアップ経由で新端末移行対象（OS仕様） | **LJD人生DB鍵の第一候補** |
| AfterFirstUnlock（`kSecAttrAccessibleAfterFirstUnlock`） | 初回unlock後はBGでも取得可 | 中（ロック中も取得し得る） | 移りやすい | **将来BG処理が必要になった場合の比較候補** |
| ThisDeviceOnly 系 | — | 強い | **弱い／移らない** | **森を守る唯一の鍵にしない** |
| WhenPasscodeSetThisDeviceOnly | passcode必須 | 強い | 弱い | 同上 |

**製品判断（第一候補）:**

1. **端末DB鍵:** plugin built-in Keychain の **WhenUnlocked（Verified 実測）** を iOS第一候補とする。  
2. **`AfterFirstUnlock` は比較候補として残す**（正当なBG読込が製品要件になった場合のみ）。  
3. **ThisDeviceOnly 系を「森を守る唯一の鍵」にしない。**  
4. **お引越し便の鍵材料は Keychain に閉じない**（復元コード wrap）。  
5. **plugin version 変更時は accessibility 実装を再監査する。**  
6. Apple 仕様上 WhenUnlocked item は暗号化 backup の移行対象になり得るが、**LJD の restore 成功は RG-3 で別途実測**（未了）。

### 5.2 シナリオ

| 事象 | 期待 |
| --- | --- |
| Quick Start | **バックアップ対象と実測で確認された** DB＋media＋（WhenUnlocked／migratable）Keychain 鍵が移り、森を開ける |
| 暗号化 iCloud Backup → restore | 同上を目標。平文バックアップ依存は避ける設計メモ。exclusion実測必須 |
| 端末水没 | Keychain死を前提。**小包＋復元コードのみで復帰** |
| iPhone→Android | Keychain非移行前提。小包のみ |
| アプリ削除 | コンテナ消える。Keychainエントリも消えることが多いが、残骸があり得る → 再installで DB無し＋secret有りなら orphan 掃除 |
| アプリ提供終了 | 小包＋復元コード＋（理想）可読export。運営鍵なし |

---

## 6. media 保護方式比較

| 方式 | 概要 | セキュリティ | 速度／動画 | 容量CPU | お引越し／OS backup | Android | 複雑性 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **A** iOS Data Protectionのみ | file protection class 明確化 | 中（OS準拠） | 最良 | 低 | 良い | DP≠Androidそのまま | 低 |
| **B** 全mediaをLJD暗号 | 各ファイルAEAD等 | 高 | 動画・サムネ重い | 高 | 小包再暗号化設計必須 | 再実装 | 高 |
| **C** 高機密のみ追加暗号 | 例: 指定アルバム | 中〜高 | 部分 | 中 | 中 | 中 | 中 |
| **D** その他 | DBはSQLCipher、mediaはA＋将来C | バランス | 実用 | 中 | 良い | port分離で可 | 中 |

**製品判断（初期）: D（実質 A＋SQLite Layer2、media全面Bは急がない）。**  
動画streaming・森ログMP4を最初から全暗号化すると、読返体験と電池を壊しやすい。写真もまず **適切な NSFileProtection** を保証し、必要なら後続で静止画からアプリ層暗号を足す。

### 6.1 File Protection（Designed: Complete / lock拒否は Release Gate）

**Designed:** `NSFileProtectionComplete` を DB / life-record media の候補とする。

**Verified:** 属性設定と reopen 後の維持（Simulator + 会社用 SE dummy）。

**Release Gate RG-1:** ロック中の実アクセス拒否は **実機でも未実証**（通知は来たが protected data が available のまま）。属性PASS ≠ lock拒否PASS。

| 候補 | 位置づけ |
| --- | --- |
| `NSFileProtectionComplete` | **Designed 第一候補** |
| `NSFileProtectionCompleteUntilFirstUserAuthentication` | OS既定・比較対象。初回unlock後はロック中も読める |
| UnlessOpen / None | 人生原本の既定にはしない |

### 6.2 Capacitor Filesystem と file protection（調査結論）

**FACT/調査:** Capacitor Filesystem 公式APIは Directory／read/write が中心で、**NSFileProtection class を保証する第一級パラメータは見当たらない。**  
したがって Complete まで上げるには:

- Xcode Data Protection capability / デフォルト entitlement、および／または  
- **native bridge（FileManager attributes）でディレクトリ／ファイルに protectionKey を設定**

が必要。**4B-3E:** slim `ljd-local-security` が `setCompleteProtection` / `inspectPath` を提供。一般起動では自動適用しない。lock中拒否は未実証のため「完全保護済み」と断定しない。

---

## 7. 生体認証（分離）

| 概念 | 役割 |
| --- | --- |
| 暗号鍵 | データを数学的に開く材料 |
| Local unlock（将来 Face ID） | 「森に入る」UX・再表示ゲート |

Face ID失敗でも、正当な復元コード＋小包での復旧パスを残す。今回 UX 実装なし。

---

## 8. 「森から出る」（logout）製品判断案

現行 FACT: Firebase logout。

Local-first 後の既定候補:

| 案 | 内容 | 評価 |
| --- | --- | --- |
| A 残す（平文のまま） | 共有端末弱い | 非推奨既定 |
| **B 暗号化したままロック** | ファイルは残すが端末では開けない／再認証まで | **推奨既定**（device-storage SoTの「信頼を外す」と整合） |
| C 削除 | 共有端末・譲渡前の明示アクション | オプション「この端末の森データを消す」 |

**原則: ログアウト＝人生記録削除にしない。**

---

## 9. OSバックアップ両立（最重要）

### 9.1 シナリオ期待表

| # | シナリオ | 期待される復旧パス |
| --- | --- | --- |
| 1 | 旧iPhone → Quick Start → 新iPhone | **第一防衛線:** データ＋migratable鍵。失敗時は小包 |
| 2 | iCloud Backup → restore | 暗号化バックアップ前提で同様。鍵属性を検証必須（PoC） |
| 3 | 端末水没 → お引越し便のみ | **第二防衛線:** 復元コード。Keychain不要 |
| 4 | iPhone → Android | 小包のみ。Keychain前提禁止 |
| 5 | アプリ提供終了後 | 小包＋復元コード＋将来の可読export。運営鍵なし |

**事故パターン（禁止）:**

- Quick Startでデータだけ移り、DB鍵が ThisDeviceOnly のまま旧機に残って森が永久に開かない  
- **「Libraryだからバックアップされる」等の推測で第一防衛線を設計する**（実測必須・§4.3・§15）

---

## 10. お引越し便との鍵分離（必須）

```
[端末内]
  SecureKeyStore(deviceDbKey) ──► SQLCipher(Local DB)
  (optional) deviceMediaKeys ──► 将来の media 暗号

[お引越し便]  ※別問題
  packagePayloadKey ──wrap──► 復元コード (+任意の端末ラップ)
  運営は復号鍵を持たない
```

Keychain専用鍵で小包を暗号化しない。小包SoT（`ljd-moving-package-spec.md` §9）を正とする。

---

## 11. App Store 暗号関連（チェックリスト・法的断定ではない）

出典: App Store Connect Help — [Export compliance documentation for encryption](https://developer.apple.com/help/app-store-connect/reference/export-compliance-documentation-for-encryption)、[Determine and upload…](https://developer.apple.com/help/app-store-connect/manage-app-information/determine-and-upload-app-encryption-documentation)。  
補足: SQLCipher は OS同梱に限定されない業界標準暗号として扱われやすい（Zetetic FAQ等）。**法務確認は提出前に別途。**

提出前チェック（実装有効化後）:

1. App Store Connect の暗号化質問に正確に回答する  
2. 「Apple OS内の暗号化のみ」か、追加アルゴリズム使用かを自己確認（SQLCipher有効時は後者になりやすい）  
3. フランス向け配布がある場合の French encryption declaration 要否を確認  
4. 必要ならドキュメントを App Encryption Documentation に uploadし、承認後の code を Info.plist へ  
5. `ITSAppUsesNonExemptEncryption` 等の Info.plist キー方針をXcode側で整理  
6. TestFlight / App Review 提出前に毎回質問を省略できる状態かを確認  
7. 法務・Account Holder ロールでの最終確認  

**本Phaseでは提出・設定変更を行わない。**

---

## 12. Community plugin risk

| リスク | 内容 |
| --- | --- |
| Maintenance | community 依存。Cap major 追従遅れ得る |
| SQLCipher同梱 | 暗号・ライセンス・更新がプラグイン側に引きずられる |
| Exchange | Domain `JournalRepository` は SQL文字列＋adapter境界。**交換可能度は中〜高**（接続／暗号化APIを `SqliteAdapter` に閉じれば、plugin入替や公式別経路へ移せる） |
| 最悪 | 読み出しエクスポート→別SQLiteスタックへ再インポート、小包経由再構築 |

**製品判断:** 現時点は採用継続可。ただし **adapter境界の厳守** をセキュリティPhaseの実装ルールにする。

---

## 13. Android 将来互換

| iOS | Android 置換先（設計） |
| --- | --- |
| Keychain | Android Keystore / EncryptedSharedPreferences 等（SecureKeyStore port） |
| Data Protection | 端末暗号化＋CE/DEストレージ／アプリ個別暗号 |
| SQLCipher | 同系統または Jetpack Security 周り（adapter） |
| Filesystem Library | app-specific storage（backup rules XML） |

iOS固有型を Domain に持ち込まない。

---

## 14. 推奨アーキテクチャ（過剰を削った形）

```
Layer 1  OS sandbox + Data Protection（Completeを第一候補に実測） …必須
Layer 2  SQLite SQLCipher（Local journal DB）                …推奨・次PoC中心
Layer 3  Media アプリ層暗号                                  …段階的・初期は見送り寄り（A/C）
Layer 4  plugin built-in Keychain（WhenUnlocked 実測）      …Layer2の鍵置き場
Layer 5  森のお引越し便（復元コード系・別鍵）                   …必須第二防衛・別SoT
```

**Face ID** は Layer4/5 の外の UX ゲート（将来）。

過剰設計を避けるため、初期 Hybrid では **1+2+4+5** を本線とし、**3は静止画ニーズが出てから**。  
**DBパスは Application Support を Designed 候補とする。backup/restore 実体は Release Gate（§4.3）。**

---

## 15. Security Release Gates（4B-3E）

Local-first を「正式 production 原本」と宣言する前:

| ID | Gate | 状態 |
| --- | --- | --- |
| RG-1 | 実機 lock 中アクセス拒否 | 未実証（inconclusive） |
| RG-2 | encrypted OS backup に DB＋media が含まれる | 未実施 |
| RG-3 | restore 後に DB＋media＋Keychain が揃い SQLCipher open | 未実施 |
| RG-4 | 可能なら Quick Start | 未実施 |

証拠メモ: `docs/hybrid/HYBRID_PHASE_4B3B*.md` / `4B3C1` / `4B3D` / `_real_device_group_a_*.json`。  
詳細: `docs/hybrid/HYBRID_PHASE_4B3E_SECURITY_FOUNDATION.md`。

## 15.1 旧 4B-3B PoC 案（実施済み・参照）

目的: 鍵事故を起こさず SQLCipher＋Keychain の輪を実証し、**OS第一防衛線と矛盾しない保存属性を実測で決める**。

### 15.1.a 暗号・鍵

1. **dummy** SQLite DB のみ（本物あしあと・本番DB名の破壊を避ける）  
2. SecureKeyStore経由で dummy passphrase（accessibility **WhenUnlocked** 第一候補）  
3. encrypted connection で write/read  
4. app kill / relaunch（unlock中）→ reopen 成功  
5. secret clear / 誤鍵 → 開けないことを確認  
6. （可能なら）plaintext dummy → export copy → encrypted → 平文削除  
7. **シナリオ机上:** Quick Start想定で WhenUnlocked鍵＋backup対象データ、水没想定で小包鍵と非結合  

### 15.2 OS移行・保護属性（必須実測・推測禁止）

実機／Simulatorで次を **計測して記録**する（「Libraryだからバックアップされるはず」等は禁止）:

| # | 計測対象 | 確認する属性 |
| --- | --- | --- |
| 1 | SQLite DB ファイル URL | `isExcludedFromBackup`（`NSURLIsExcludedFromBackupKey` 等） |
| 2 | DB 親 directory | `isExcludedFromBackup` |
| 3 | media directory（例: `ljd/media/journal`） | `isExcludedFromBackup` |
| 4 | 上記各ファイル／ディレクトリ | **file protection class**（`NSURLFileProtectionKey` 等） |

加えて:

- Complete を候補適用した場合の **動画・ロック中挙動**の相性観察（確定はしない）  
- Cap Filesystemだけでは不足なら native bridge 要否を実測で判断  
- dummy 画像1枚の protection class  

測定結果をもって **正式DB保存場所（§4.3）** を決める。

**やらない:** bulk migration、Local原本化、本物日記の暗号化、お引越し便本番実装、本番 `capacitor.config` の本確定変更（PoC計測後の別差分とする）。

---

## 16. Unresolved issues

- Release Gates RG-1〜RG-4（lock / backup中身 / restore / Quick Start）
- Cap SQLite `changeEncryptionSecret` の実機再確認（dummy では実施済）
- `NSFileProtectionComplete` と動画再生／background の相性
- media 全面暗号の電池・4K動画コスト
- logout「ロック」UXコピー
- 共有iPad / 家族端末
- フランス含む各国の宣言要否の法務確定
- plugin version 変更時の Keychain accessibility 再監査
- Android backup rules 初版

---

## 17. 関連・優先順

矛盾時: 世界観 → Local-first方針 → お引越し便仕様 → 端末保存・復元仕様 → **本セキュリティ仕様** → Hybrid作業メモ → コード。

実証メモ: `docs/hybrid/HYBRID_PHASE_4B3E_SECURITY_FOUNDATION.md` および 4B-3B〜3D。
