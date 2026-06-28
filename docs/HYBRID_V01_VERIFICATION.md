# LJD ハイブリッド v0.1 — 実機・シミュレータ確認手順

このドキュメントは、**v0.1 の動作確認**（Capacitor 上で既存 LJD がオンライン動作するか）を、初心者でも迷わず進められるようにまとめたものです。

- **作業ブランチ:** `feature/hybrid-v0.1-capacitor`
- **main への merge:** まだしない
- **v0.2（オフライン等）:** まだ着手しない

---

## 全体の流れ（最初に読む）

確認は **2つのターミナル** と **Xcode または Android Studio** を使います。

```
┌─────────────────────────────────────────────────────────┐
│ ターミナル A: Next.js 開発サーバー（LJD 本体）            │
│   npm run dev  →  http://127.0.0.1:3000                 │
└─────────────────────────────────────────────────────────┘
                          ↑ WebView がここを表示
┌─────────────────────────────────────────────────────────┐
│ ターミナル B: Capacitor 同期 + ネイティブアプリ起動       │
│   npm run cap:sync:local                                │
│   npm run cap:open:ios  （または android）              │
└─────────────────────────────────────────────────────────┘
```

**重要:** Capacitor アプリ単体では日記は動きません。必ず **ターミナル A の dev サーバーが起動していること** を確認してください。

---

## 事前準備（Mac 共通）

### 1. ブランチと依存関係

```bash
cd /path/to/numerology-mvp
git checkout feature/hybrid-v0.1-capacitor
git pull   # remote がある場合
npm install
```

### 2. 環境変数（`.env.local`）

`.env.local.example` を参考に、**`.env.local`** を用意します（Git には上げない）。

最低限必要:

| 変数 | 用途 |
|------|------|
| `DATABASE_URL` | ローカル Postgres（下記 Docker） |
| `NEXT_PUBLIC_FIREBASE_*` | ログイン |
| `NEXT_PUBLIC_APP_URL` | `http://127.0.0.1:3000` |

```bash
# DB 起動（初回または停止している場合）
npm run db:local:up
npm run db:local:sync   # 初回のみ
```

### 3. ブラウザで先に動くか確認（推奨）

Capacitor の前に、通常ブラウザで LJD が動くことを確認します。

```bash
npm run dev
```

ブラウザで http://127.0.0.1:3000 を開き、ログイン → 日記入力まで試してください。  
ここで失敗する場合は、Capacitor 以前の問題（DB / Firebase 設定）です。

---

# 1. Mac / Xcode での iOS 確認手順

## 必要なインストール

| 項目 | 必須？ | 説明 |
|------|--------|------|
| **Xcode** | **必須** | App Store からインストール（容量 10GB 以上） |
| **Xcode Command Line Tools** | 必須 | 初回 Xcode 起動時にインストールを促されます |
| **Node.js / npm** | 必須 | プロジェクト開発環境 |
| **Docker Desktop** | 推奨 | ローカル DB 用 |
| **CocoaPods** | 通常不要 | Capacitor 8 は Swift Package Manager を使用 |

### Xcode の初回セットアップ

1. App Store で **Xcode** をインストール
2. Xcode を起動 → 追加コンポーネントのインストールを完了
3. **Xcode → Settings → Platforms** で **iOS Simulator** が入っていることを確認

## iOS Simulator で確認できるか

**はい。v0.1 の基本確認は Simulator で十分です。**

- iPhone 実機は **必須ではありません**
- Simulator でもログイン・日記入力・写真選択（Mac の写真ライブラリ）・保存・プレビューまで確認できます

## iPhone 実機が必要な場面

| 場面 | 実機 |
|------|------|
| v0.1 基本動作（Simulator） | 不要 |
| カメラ撮影 → 日記写真 | Simulator では「ファイル選択」相当。カメラ動作は実機推奨 |
| キーボード・SafeArea の最終確認 | 実機推奨（機種差あり） |
| App Store 配布前 | 必須 |

## Apple Developer 登録

| 場面 | 登録 |
|------|------|
| **Simulator のみ** | **不要**（無料 Apple ID で可） |
| **自分の iPhone に USB インストール** | **無料 Apple ID** で可能（7日ごとの再署名が必要な場合あり） |
| **TestFlight / App Store 公開** | **有料 Apple Developer Program**（年 $99）が必要 |

v0.1 では **Simulator または無料 Apple ID の実機** で足ります。

---

## iOS 実行手順（Simulator）

### ステップ 1: 開発サーバー起動（ターミナル A）

```bash
cd /path/to/numerology-mvp
npm run dev
```

次の表示が出れば OK:

```
Local: http://127.0.0.1:3000
```

**このターミナルは閉じないでください。**

### ステップ 2: Capacitor 同期（ターミナル B）

```bash
cd /path/to/numerology-mvp
npm run cap:sync:local
```

`[cap-sync] CAPACITOR_SERVER_URL=http://127.0.0.1:3000` と表示されれば OK。

### ステップ 3: Xcode で開く

```bash
npm run cap:open:ios
```

Xcode が起動し、`ios/App/App.xcodeproj` が開きます。

### ステップ 4: Simulator を選ぶ

1. Xcode 上部ツールバー **真ん中あたり** の端末名（例: `App > iPhone 16`）をクリック
2. **iPhone 16** など任意の Simulator を選択

### ステップ 5: 実行（Run）

1. 左上の **▶（Run）** ボタンをクリック  
   またはキーボード **⌘ + R**
2. Simulator が起動し、LJD アプリが開きます
3. 数秒後、**ログイン画面または LJD トップ** が表示されれば成功

### ステップ 6: 日記フロー確認

1. ログイン（後述「Firebase 注意」）
2. カレンダーまたは日記一覧から **新規日記** を開く
3. 本文・気分・写真を入力
4. **保存** → プレビュー画面へ
5. **戻る**（画面内リンク or アプリ内ナビ）

---

## iOS 実機で確認する場合（任意）

1. iPhone を USB で Mac に接続
2. iPhone で **「このコンピュータを信頼」**
3. Xcode 上部の端末選択で **接続した iPhone** を選ぶ
4. **Signing & Capabilities**（左ペイン `App` → `Signing`）で Team に Apple ID を設定
5. ▶ Run

**WebView URL:** 実機は Mac の `127.0.0.1` に直接届きません。次のどちらかが必要です。

| 方法 | 手順 |
|------|------|
| **A. LAN dev（推奨）** | ターミナル A: `npm run dev:lan`。Mac の IP を確認: `ipconfig getifaddr en0`。ターミナル B: `CAPACITOR_SERVER_URL=http://192.168.x.x:3000 npm run cap:sync`。Mac と iPhone が **同じ Wi‑Fi** |
| **B. Vercel Preview** | Preview URL を `CAPACITOR_SERVER_URL` に指定して `npm run cap:sync` |

---

## iOS でエラーが出やすいポイント

| 症状 | 原因 | 対処 |
|------|------|------|
| 真っ白 / 「読み込めません」 | dev サーバー未起動 | ターミナル A で `npm run dev` |
| プレースホルダ HTML のみ | `cap sync` 未実行 or URL 未設定 | `npm run cap:sync:local` |
| Xcode Build Failed | 初回コンポーネント未 DL | Xcode を開き Platforms を確認 |
| Signing エラー | Team 未設定 | Signing で Apple ID を選択 |
| ログイン後すぐ落ちる | cookie / Firebase | 下記 Firebase 節 |
| 写真が選べない | Simulator の権限 | Simulator メニュー **Features → Photos** |

---

## Firebase ログイン確認時の注意（iOS）

LJD のログイン方式:

| 方式 | iOS WebView での挙動 |
|------|----------------------|
| **Google** | まずポップアップ → 失敗時リダirect |
| **メール + パスワード** | 通常どおり入力 |

### 確認のコツ

1. **まずメール + パスワード** で試す（WebView で安定しやすい）
2. Google の場合:
   - 「Google で続ける」→ Google 画面 → 戻る
   - 長く待ってもログイン画面のまま → **もう一度** ボタンを押す
   - リダイレクト後「Google の認証から戻ってきました」と出ることがある（正常）
3. Firebase Console → **Authentication → Settings → Authorized domains** に以下があるか確認:
   - `localhost`
   - Preview URL を使う場合はそのドメイン
4. **LAN 実機** の場合、`192.168.x.x` は Authorized domains に **追加できない** ため、Preview URL か Simulator（127.0.0.1）を使う

### ログイン成功の目安

- カレンダー / マイページ / 日記入力に進める
- 日記保存後にプレビューが開く

---

## 写真選択確認時の注意（iOS）

| 環境 | 挙動 |
|------|------|
| **Simulator** | Mac の写真ライブラリから選択（カメラ撮影ではない） |
| **実機** | 「写真ライブラリ」または「カメラ」が OS ダイアログで出る |

- v0.1 では **端末へのオフライン保存はしない**（通常どおりサーバーへ POST）
- 写真選択後、プレビューサムネイルが表示されれば OK
- 保存後プレビューで写真が見えれば OK
- 初回は **写真へのアクセス許可** ダイアログで「許可」を選ぶ

---

# 2. Android 確認手順

## Android Studio が必要か

**はい。Android エミュレータまたは実機デバッグには Android Studio が必要です。**

| 項目 | 説明 |
|------|------|
| ダウンロード | https://developer.android.com/studio |
| 初回起動 | SDK / Emulator イメージのインストール（数 GB） |
| Java | Android Studio に同梱（別途 JDK 設定は通常不要） |

## エミュレータで確認できるか

**はい。v0.1 の基本確認はエミュレータで可能です。**

## 実機で確認する場合

1. Android 端末で **開発者向けオプション** → **USB デバッグ** を ON
2. USB 接続
3. Android Studio 上部の端末一覧で実機を選択 → Run

**WebView URL:** 実機 + ローカル dev の場合は **Mac の LAN IP** + `npm run dev:lan`（iOS 実機と同様）。  
エミュレータのみなら **`10.0.2.2`** を使います（後述）。

---

## Android 実行手順（エミュレータ）

### ステップ 1: 開発サーバー（ターミナル A）

```bash
npm run dev
```

`127.0.0.1:3000` で起動していること。

### ステップ 2: Capacitor 同期（ターミナル B）

**Android エミュレータ用（重要）:**

```bash
npm run cap:sync:local:android
```

これは内部で `CAPACITOR_SERVER_URL=http://10.0.2.2:3000` を使います。

> **なぜ `10.0.2.2`？**  
> Android エミュレータから見た「ホスト Mac の localhost」が `10.0.2.2` だからです。  
> `127.0.0.1` だとエミュレータ自身を指してしまい、接続できません。

### ステップ 3: Android Studio で開く

```bash
npm run cap:open:android
```

`android/` プロジェクトが Android Studio で開きます。

### ステップ 4: エミュレータを用意

1. **Device Manager**（ツールバーのスマホアイコン）を開く
2. **Create Device** → Pixel 系 → システムイメージ（API 34 推奨）を DL
3. エミュレータを **▶ Start** で起動

### ステップ 5: Run

1. 上部ツールバーで **app** と **起動済みエミュレータ** が選ばれていることを確認
2. **▶ Run**（または **Shift + F10**）
3. LJD が起動し WebView で LJD が表示される

---

## `10.0.2.2:3000` の設定まとめ

| 確認対象 | コマンド | WebView URL |
|----------|----------|-------------|
| iOS Simulator | `npm run cap:sync:local` | `http://127.0.0.1:3000` |
| Android Emulator | `npm run cap:sync:local:android` | `http://10.0.2.2:3000` |
| 実機（iOS/Android） | `CAPACITOR_SERVER_URL=http://192.168.x.x:3000 npm run cap:sync` + `npm run dev:lan` | Mac の LAN IP |

URL を変えたら **必ず** `cap:sync` を再実行してから Run し直してください。

---

## Android でエラーが出やすいポイント

| 症状 | 原因 | 対処 |
|------|------|------|
| 真っ白 / net::ERR | dev サーバー未起動 or  wrong URL | `npm run dev` + `cap:sync:local:android` |
| `127.0.0.1` で繋がらない | エミュレータの localhost 問題 | `10.0.2.2` を使う |
| Gradle sync 失敗 | SDK 未インストール | Android Studio の SDK Manager |
| INSTALL_FAILED | 古い APK 競合 | エミュレータでアプリ削除 → 再 Run |
| Google ログインループ | WebView + redirect | メールログインを先に試す |
| 写真が選べない | エミュレータに画像なし | Gallery に画像をドラッグ投入 |

---

# 3. v0.1 手動チェックリスト

確認が終わったら `[x]` を付けて記録してください。

## 起動・ログイン

- [ ] **アプリ起動** — Capacitor アプリが落ちずに WebView が表示される
- [ ] **ログイン** — Google または メール+パスワード で LJD に入れる
- [ ] **本番 LJD に影響なし** — 確認中に本番 URL（life-journey-zeta.vercel.app）のデータを意図せず変更していない（ローカル or Preview のみ使用）

## 日記入力

- [ ] **日記入力画面を開く** — `/journal` 相当の画面が表示される
- [ ] **本文入力** — テキストが入力できる
- [ ] **気分選択** — 気分アイコン/選択が動く
- [ ] **写真選択** — ギャラリー（またはカメラ）から画像を選べる
- [ ] **保存** — エラーなく保存完了（保存演出 → プレビューへ）
- [ ] **プレビュー表示** — 読み解きコメント・本文・写真が表示される

## UI / 操作性

- [ ] **戻る操作** — 画面内リンク、Android 戻るボタンで意図どおり戻れる
- [ ] **キーボード表示** — 入力時にキーボードで本文欄が隠れすぎない
- [ ] **SafeArea** — ノッチ / ステータスバー / ホームインジケータと重ならない
- [ ] **画面下部ボタンの見切れ** — 保存ボタン・下タブが隠れない
- [ ] **Web ブラウザ版と大きな差がない** — 同じ dev URL を Safari/Chrome と見比べ、レイアウト崩れがない

## プラットフォーム（該当する方）

- [ ] **iOS Simulator** で上記を確認した
- [ ] **Android Emulator** で上記を確認した
- [ ] （任意）**実機** で追加確認した

---

# 4. 問題が出た場合の報告フォーマット

原因調査のため、以下を **コピペまたはスクリーンショット** で共有してください。

```markdown
## v0.1 確認エラー報告

### 環境
- 日付:
- ブランチ: feature/hybrid-v0.1-capacitor
- コミット: （`git log -1 --oneline` の結果）
- プラットフォーム: iOS Simulator / Android Emulator / 実機
- 端末名:
- OS バージョン:

### WebView 設定
- CAPACITOR_SERVER_URL: （例 http://127.0.0.1:3000）
- dev サーバー: npm run dev / dev:lan / Preview URL
- ブラウザ（Safari/Chrome）では同じ URL で動作したか: はい / いいえ

### 再現手順
1.
2.
3.

### 期待した結果


### 実際の結果


### エラー画面
（スクリーンショットを添付）

### ターミナル A（npm run dev）のログ
```
（該当行を貼る）
```

### ターミナル B（cap sync 等）のログ
```
```

### Xcode / Android Studio のログ
- Xcode: **View → Debug Area → Activate Console**（⌘⇧C）の赤いエラー行
- Android Studio: **Logcat** で `Error` / `chromium` / `Capacitor` をフィルタ

### Firebase / ログイン
- 使用した方法: Google / メール+パスワード
- 画面に出たエラー文（そのまま）:

### ネットワーク
- Mac と端末は同じ Wi‑Fi か:
- ファイアウォール / VPN 使用中:

### 補足


```

### 特に欲しい情報（症状別）

| 症状 | 追加で欲しいもの |
|------|------------------|
| 真っ白 | dev サーバー起動有無、`cap:sync` 後の URL、Simulator/Emulator の Network 設定 |
| ログイン不可 | Firebase 方式、エラー全文、Authorized domains、WebView 内か Safari 単体か |
| 保存失敗 | 画面のエラーメッセージ、dev ターミナルの `POST /api/journal` ログ |
| 写真 | Simulator か実機か、権限ダイアログの有無 |
| UI 崩れ | スクショ（ブラウザ版との比較があると ideal）、機種名 |

---

## 確認完了後

1. チェックリスト結果を共有
2. 問題なければ **「v0.1 動作検証 OK」** と判断
3. その後に v0.2（オフライン保存）着手可否を相談

**まだ v0.2 には進めません。** 上記確認が終わるまでお待ちください。

---

## 関連ドキュメント

- [HYBRID_V01.md](./HYBRID_V01.md) — 検証環境の概要
- [DEV_DATABASE.md](./DEV_DATABASE.md) — ローカル DB セットアップ
