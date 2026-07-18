/** /guide — はじめての操作でつまずきやすいポイント（案内所の世界観案内とは別） */

export const GUIDE_OPERATION_PAGE_TITLE = "はじめての操作ヒント" as const;

export const GUIDE_OPERATION_PAGE_DESCRIPTION =
  "画面のどこを押すか、迷ったときのための短いヒントです。物語や世界観の説明は、森の案内所をご覧ください。" as const;

export type GuideOperationTip = {
  id: string;
  title: string;
  body: string;
  note?: string;
  link?: { href: string; label: string };
};

export const GUIDE_OPERATION_TIPS: readonly GuideOperationTip[] = [
  {
    id: "desk-write",
    title: "日記は、どこから書く？",
    body: "ログハウスの室内で「今日のあしあとを残す」をタップします。普段は「今日はどうしますか？」が開き、ひとりで書くか・鑑定士といっしょに書くかを選べます。",
    note: "はじめての日記（まだ1件もないとき）は、選択を挟まず鑑定士といっしょに書く流れへ進みます。",
    link: { href: "/orders", label: "ログハウスを開く" },
  },
  {
    id: "hint",
    title: "家具の名前がわからないときは？",
    body: "ログハウス右上の「？」を押すと、本棚や「今日のあしあとを残す」・ポストなどの名前が小さく表示されます。もう一度押すと消えます。",
    link: { href: "/orders", label: "ログハウスで試す" },
  },
  {
    id: "profile",
    title: "プロフィールはいつ選ぶ？",
    body: "日記は、いま選んでいるプロフィールに残ります。プロフィールが複数あるときは、「今日のあしあとを残す」のあとの書き方選択画面の上部で切り替えられます。1つだけのときは、その確認は出ません。",
  },
  {
    id: "find-diary",
    title: "書いた日記を、あとから探すには？",
    body: "日付で振り返るときは画面下の「カレンダー」。タグやキーワードで探したいときは「あしあと帳」の上部にある「日記を探す」を使います。",
    link: { href: "/orders/list", label: "あしあと帳を開く" },
  },
  {
    id: "tags",
    title: "タグは、いつ付ける？",
    body: "今日のあしあとを残すとき（ひとりでも、いっしょに書くときでも）「タグをつける」から付けられます。付けておくと、あとでタグ検索やあしあとブックのテーマ絞り込みに使えます。なくても大丈夫です。",
  },
  {
    id: "go-out",
    title: "お庭や案内図へはどう行く？",
    body: "ログハウスの玄関付近の靴をタップすると「おでかけ」が開きます。そこからお庭や森の案内図などへ進めます。",
    link: { href: "/orders/go-out", label: "おでかけを開く" },
  },
  {
    id: "mailbox",
    title: "ポストとお知らせは？",
    body: "玄関のポストをタップすると、ヤギの郵便屋さんからのお届けものが確認できます。未読があると、お手紙ありの見た目に変わります。",
    link: { href: "/orders/mailbox", label: "ポストを開く" },
  },
  {
    id: "day-night",
    title: "昼なのに夜の部屋／その逆になった",
    body: "ログハウスの表示設定で、昼・夜・自動を選べます。自動はおおよそ夕方ごろから夜の部屋になります。お庭や案内図も同じ時間帯に合わせます。",
  },
  {
    id: "bookshelf-binding",
    title: "製本を注文したいときの流れは？",
    body: "本棚であしあとブックを選び、開いたあとの画面から「製本版を注文する」へ進みます。アプリで製本コードを用意したあと、お支払いは別途 BASE のショップで行います（外部の商品ページへ移動します）。",
    link: { href: "/orders/bookshelf", label: "本棚を開く" },
  },
  {
    id: "pdf",
    title: "鑑定書PDFを端末に残したい",
    body: "本棚で鑑定書を選ぶとPDFを開けます。保存のしかたは機種によって少しちがうので、専用の手順ページを用意しています。",
    link: { href: "/help/pdf-download", label: "PDFの保存方法を見る" },
  },
  {
    id: "homescreen",
    title: "ホーム画面からすぐ開きたい",
    body: "ブラウザの「ホーム画面に追加」を使うと、アプリアイコンのように開けます。手順は別ページにまとめています。",
    link: { href: "/help/home-screen", label: "追加の手順を見る" },
  },
] as const;

export const GUIDE_OPERATION_STATION_CROSSLINK_LABEL =
  "森の案内所で、世界の歩き方を見る" as const;

export const GUIDE_OPERATION_STATION_CROSSLINK_HREF = "/help/ljd" as const;
