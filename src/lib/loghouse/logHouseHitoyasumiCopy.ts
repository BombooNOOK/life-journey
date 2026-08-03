export const LOG_HOUSE_HITOYASUMI_PAGE_PATH = "/orders/hitoyasumi" as const;

export const LOG_HOUSE_HITOYASUMI_PAGE_TITLE = "ひとやすみの椅子" as const;

export const LOG_HOUSE_HITOYASUMI_PAGE_DESCRIPTION =
  "この端末でつくった森ログカードやムービーを、ここでゆっくり見返せます。" as const;

/** 入口ヘルプ（巨大アイコン向け） */
export const LOG_HOUSE_HITOYASUMI_HELP_BODY =
  "この端末でつくった森ログカードやムービーを見返せます。\n動画から森ログムービーをつくれます。\nカードやムービーをまとめてアルバムにできます。\n音のかけらを聴く場所も、これから少しずつ増やしていきます。" as const;

export const LOG_HOUSE_HITOYASUMI_HELP_BUTTON_LABEL = "ひとやすみの椅子の説明" as const;

export const LOG_HOUSE_HITOYASUMI_HELP_DISMISS = "とじる" as const;

export const LOG_HOUSE_HITOYASUMI_BACK_TO_ENTRANCE = "椅子の入口へ戻る" as const;

/** 入口：巨大アイコン（背景とは分離） */
export const LOG_HOUSE_HITOYASUMI_ENTRY_CARD_SRC =
  "/images/ljd/hitoyasumi/chair-entry-card.png?v=2" as const;

export const LOG_HOUSE_HITOYASUMI_ENTRY_MOVIE_SRC =
  "/images/ljd/hitoyasumi/chair-entry-movie.png?v=2" as const;

export const LOG_HOUSE_HITOYASUMI_ENTRY_ALBUM_SRC =
  "/images/ljd/hitoyasumi/chair-entry-album.png?v=2" as const;

export const LOG_HOUSE_HITOYASUMI_ENTRY_SOUND_SRC =
  "/images/ljd/hitoyasumi/chair-entry-sound.png?v=2" as const;

/** 木札ラベル（aria / ヘルプ用。画像側に焼き込み済み） */
export const LOG_HOUSE_HITOYASUMI_ENTRY_CARD_LABEL = "これまでの森ログを見る" as const;

export const LOG_HOUSE_HITOYASUMI_ENTRY_MOVIE_LABEL = "動画から森ログムービーを作る" as const;

export const LOG_HOUSE_HITOYASUMI_ENTRY_ALBUM_LABEL = "思い出をアルバムにまとめる" as const;

export const LOG_HOUSE_HITOYASUMI_ENTRY_SOUND_LABEL = "音のカケラを聴く" as const;

export const LOG_HOUSE_HITOYASUMI_SOUND_SOON_TITLE = "音のかけらは準備中です" as const;

export const LOG_HOUSE_HITOYASUMI_SOUND_SOON_BODY =
  "森の音のかけらを、ここでゆっくり聴けるようにしていきます。いまは入口だけ先に置いてあります。" as const;

/** ひとやすみの椅子の背景（昼＝明るい居間 / 夜＝最初の夕暮れの森） */
export const LOG_HOUSE_HITOYASUMI_BG_BY_TIME = {
  day: "/images/ljd/hitoyasumi/rest-chair-bg-day.png?v=1",
  night: "/images/ljd/hitoyasumi/rest-chair-bg-night.png?v=1",
} as const;

/** @deprecated 昼背景。LOG_HOUSE_HITOYASUMI_BG_BY_TIME.day を使ってください */
export const LOG_HOUSE_HITOYASUMI_BG_SRC = LOG_HOUSE_HITOYASUMI_BG_BY_TIME.day;

export const LOG_HOUSE_HITOYASUMI_FILTER_CARD_SRC =
  "/images/ljd/hitoyasumi/hitoyasumi-filter-card.png" as const;

export const LOG_HOUSE_HITOYASUMI_FILTER_MOVIE_SRC =
  "/images/ljd/hitoyasumi/hitoyasumi-filter-movie.png" as const;

export const LOG_HOUSE_HITOYASUMI_FILTER_ALBUM_SRC =
  "/images/ljd/hitoyasumi/hitoyasumi-filter-album.png" as const;

/** 一覧アイテムの紙カード枠（ラベル付き） */
export const LOG_HOUSE_HITOYASUMI_ITEM_FRAME_CARD_SRC =
  "/images/ljd/hitoyasumi/hitoyasumi-item-frame-card.png" as const;

export const LOG_HOUSE_HITOYASUMI_ITEM_FRAME_MOVIE_SRC =
  "/images/ljd/hitoyasumi/hitoyasumi-item-frame-movie.png" as const;

export const LOG_HOUSE_HITOYASUMI_ITEM_FRAME_ALBUM_SRC =
  "/images/ljd/hitoyasumi/hitoyasumi-item-frame-album.png" as const;

export const LOG_HOUSE_HITOYASUMI_EMPTY_TITLE = "まだ森ログがありません" as const;

export const LOG_HOUSE_HITOYASUMI_EMPTY_BODY =
  "あしあとから「カードを作成」や「ムービーを作成」をすると、ここに並びます。\n端末への保存やSNSへの共有も、ここから行えます。" as const;

export const LOG_HOUSE_HITOYASUMI_NO_PREVIEW =
  "プレビュー用の画像がこの端末にありません。あしあとからもう一度作成すると、ここで見返せます。" as const;

export const LOG_HOUSE_HITOYASUMI_SAVE_DEVICE = "端末に保存" as const;

export const LOG_HOUSE_HITOYASUMI_SHARE = "共有する" as const;

export const LOG_HOUSE_HITOYASUMI_ACTION_HINT =
  "写真アプリやSNSへは、下のボタンから保存・共有できます。" as const;

export const LOG_HOUSE_HITOYASUMI_ACTION_OK = "共有メニューを開きました。必要なアプリを選んでください。" as const;

export const LOG_HOUSE_HITOYASUMI_ACTION_CANCELLED = "共有をキャンセルしました。" as const;

export const LOG_HOUSE_HITOYASUMI_ACTION_FAIL = "保存・共有を開始できませんでした。もう一度お試しください。" as const;

export const LOG_HOUSE_HITOYASUMI_DELETE = "削除する" as const;

export const LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM_TITLE = "この森ログを削除しますか？" as const;

export const LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM_BODY =
  "椅子の一覧から消えます。写真アプリなどにすでに保存したものは残ります。" as const;

export const LOG_HOUSE_HITOYASUMI_DELETE_CONFIRM = "削除する" as const;

export const LOG_HOUSE_HITOYASUMI_DELETE_CANCEL = "やめる" as const;

export const LOG_HOUSE_HITOYASUMI_DELETE_FAIL = "削除できませんでした。もう一度お試しください。" as const;

export const LOG_HOUSE_HITOYASUMI_FILTER_ALL = "すべて" as const;
/** 入口の「ムービーを作る」と区別するため、仕分けは静止画／動画と書く */
export const LOG_HOUSE_HITOYASUMI_FILTER_STILL = "静止画" as const;
export const LOG_HOUSE_HITOYASUMI_FILTER_VIDEO = "動画" as const;
export const LOG_HOUSE_HITOYASUMI_FILTER_CARD = "カード" as const;
export const LOG_HOUSE_HITOYASUMI_FILTER_MOVIE = "ムービー" as const;
export const LOG_HOUSE_HITOYASUMI_FILTER_ALBUM = "アルバム" as const;

export const LOG_HOUSE_HITOYASUMI_FILTER_BAR_LABEL = "種類で絞り込み" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SCREEN_TITLE = "アルバム" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SHELF_EMPTY =
  "まだアルバムがありません。森ログを選んで、1冊にまとめてみましょう。" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SHELF_COUNT = (n: number) =>
  `${n}冊のアルバム` as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_COMPOSE_CTA = "新しくまとめる" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_BACK_TO_SHELF = "アルバム一覧へ" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_COMPOSE_TITLE = "アルバムにまとめる" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_TITLE_LABEL = "アルバムのタイトル" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_TITLE_PLACEHOLDER = "例）春の森ログ" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_TAG_LABEL = "タグで絞り込み" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_TAG_EMPTY = "まだタグ付きの森ログがありません" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_MATCH_COUNT = (n: number) =>
  `${n}件が候補です` as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SELECTED_COUNT = (n: number) =>
  `${n}件を選択中` as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SELECT_ALL = "表示中をすべて選択" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_DESELECT_VISIBLE = "表示中の選択を解除" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SAVE = "この内容でまとめる" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SAVE_NEED_SELECTION =
  "アルバムに入れる森ログを、チェックで選んでください。" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SAVE_FAIL =
  "アルバムを保存できませんでした。もう一度お試しください。" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_ITEM_COUNT = (n: number) => `${n}枚` as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PREV = "前へ" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_NEXT = "次へ" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PAUSE = "一時停止" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_PLAY = "再生" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_LOOP_ON = "ループ中" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_LOOP_OFF = "ループなし" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_START = "全画面で見る" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_VIEWER_EMPTY =
  "このアルバムの森ログが、この端末に見つかりませんでした。" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SOON_TITLE = "アルバムは準備中です" as const;

export const LOG_HOUSE_HITOYASUMI_ALBUM_SOON_BODY =
  "カードやムービーをタグや日付で選び、タイトルをつけて1冊にまとめる場所です。これから少しずつ育てていきます。" as const;

export const LOG_HOUSE_HITOYASUMI_MOVIE_SOON_TITLE = "動画ムービーは準備中です" as const;

export const LOG_HOUSE_HITOYASUMI_MOVIE_SOON_BODY =
  "元の動画から森ログムービーをつくる入口です。いまは準備中なので、あしあとからカード＋BGMのムービーをお楽しみください。" as const;

export const LOG_HOUSE_HITOYASUMI_CLOSE_DETAIL = "閉じる" as const;

/** 作成成功などから一覧へ直接入るときのクエリ */
export const LOG_HOUSE_HITOYASUMI_BROWSE_QUERY = "view=browse" as const;

export const LOG_HOUSE_HITOYASUMI_BROWSE_PATH =
  `${LOG_HOUSE_HITOYASUMI_PAGE_PATH}?${LOG_HOUSE_HITOYASUMI_BROWSE_QUERY}` as const;
