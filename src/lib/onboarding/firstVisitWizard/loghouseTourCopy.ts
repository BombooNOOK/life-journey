/** 第3章：ログハウス室内のはじめて案内 */

export const LOGHOUSE_TOUR_DESK_OWL_QUOTE =
  "ここが、あなたの机です。\n\n今日のあしあとは、ここから残せます。\nひとりで書くことも、どうぶつ鑑定士といっしょに書くこともできます。" as const;

export const LOGHOUSE_TOUR_DESK_NEXT = "次へ" as const;

export const LOGHOUSE_TOUR_MAILBOX_OWL_QUOTE =
  "さっきの鑑定書、もうできているみたいですね。\n\n玄関のポストに、お手紙が届いています。\nまずはポストをのぞいてみましょう。" as const;

export const LOGHOUSE_TOUR_MAILBOX_OPEN = "ポストを開く" as const;

/** ポスト画面に重ねる、はじめて案内の補足 */
export const LOGHOUSE_TOUR_MAILBOX_PAGE_BANNER =
  "ヤギさん郵便から、どんぐりやお知らせが届きます。\n\n「森の住民登録のお祝い」や「今日のおとどけ」では、どんぐりが毎日届くしくみがわかります。\n「鑑定書が届きました」のお手紙も、このなかにありますよ。\n\n読み終わったら、下のボタンで案内に戻ってください。" as const;

export const LOGHOUSE_TOUR_BOOKSHELF_OWL_QUOTE =
  "鑑定書や、あしあとブックは、\nこちらの本棚にしまわれていきます。\n\n残したあしあとは、ここで一冊の本（あしあとブック）にすることができます。\n\n今、本棚で鑑定書を見ますか？" as const;

export const LOGHOUSE_TOUR_BOOKSHELF_GUIDE_LINK_LABEL = "詳しい手順はこちらをご覧ください" as const;

/** 森の案内所・あしあとブック説明（returnTo 付きは build 関数を使う） */
export const LOGHOUSE_TOUR_BOOKSHELF_GUIDE_HASH = "diary-book" as const;

export const LOGHOUSE_TOUR_BOOKSHELF_OPEN_NOW = "今、本棚を見る" as const;
export const LOGHOUSE_TOUR_BOOKSHELF_LATER = "あとにする" as const;

export const LOGHOUSE_TOUR_HINT_OWL_QUOTE =
  "どこに何があるか迷ったら、\n上の「？」をタップしてみてください。\n\n小さな名前ラベルが出た場所には、中へ入れます。" as const;

export const LOGHOUSE_TOUR_HINT_NEXT = "次へ" as const;

export const LOGHOUSE_TOUR_WRAP_UP_OWL_QUOTE =
  "ざっとですが、ログハウスのご案内はここまでです。\n\n他にもラジカセや今日の鑑定結果など色々あるので、少しずつのぞいてみてくださいね。" as const;

export const LOGHOUSE_TOUR_WRAP_UP_NEXT = "次へ" as const;

export const LOGHOUSE_TOUR_INVITE_OWL_QUOTE =
  "では改めて、今日のあしあとを残しましょう。\n\n最初は、どうぶつ鑑定士といっしょに書いてみましょうね。" as const;

export const LOGHOUSE_TOUR_INVITE_CTA = "机に向かう" as const;

/** 机ハイライト待ち：カード内の案内（下の別チップは出さない） */
export const LOGHOUSE_TOUR_AWAITING_DESK_OWL_QUOTE =
  "机がやわらかく光っています。\n\n光っている机（「今日のあしあとを残す」）をタップしてください。" as const;

export const LOGHOUSE_TOUR_DESK_TAP_HINT = "光っている机をタップ" as const;

export const LOGHOUSE_TOUR_PLEASE_CONTINUE =
  "まずはご案内の続きを見てみましょう" as const;

export const LOGHOUSE_TOUR_A11Y_LABEL = "ログハウスのご案内" as const;

/** ポスト／本棚などから案内へ戻るときのラベル */
export const LOGHOUSE_TOUR_RETURN_LABEL = "案内に戻る（ログハウス）" as const;

export const LOGHOUSE_TOUR_PREVIEW_COMPLETE_MESSAGE =
  "案内はここまでです。本番では、このあとあしあとを残す画面へ進みます。" as const;

export const LOGHOUSE_TOUR_PREVIEW_RESTART = "はじめから案内を見る" as const;
