/** どんぐり帳・カプセルの世界観コピー（金融用語を避ける） */

export const DONGURI_CHO_TITLE = "どんぐり帳" as const;

export const DONGURI_BALANCE_LABEL = "いまのどんぐり" as const;

export const DONGURI_TODAY_DELIVERY_LABEL = "今日のおとどけ" as const;

export const DONGURI_RECENT_LEDGER_LABEL = "最近のきろく" as const;

export const DONGURI_OPEN_LEDGER_LABEL = "どんぐり帳を見る" as const;

export const DONGURI_CAPSULE_ARIA_LABEL = "どんぐり帳を開く" as const;

export const DONGURI_CLOSE_LABEL = "閉じる" as const;

export const DONGURI_UNIT = "こ" as const;

export const DONGURI_EMPTY_LEDGER =
  "まだきろくはありません。森で使うと、ここに残ります。" as const;

/** どんぐり帳：受け取り方案内（購入・課金の強い表現は使わない） */
export const DONGURI_RECEIVE_WAYS_TITLE = "どんぐりの受け取り方" as const;

export const DONGURI_RECEIVE_WAYS = [
  {
    title: "ヤギさん郵便",
    body: "毎日ログハウスに来ると、どんぐりが届きます。",
  },
  {
    title: "森の定期便",
    body: "毎月どんぐり100こが届く予定です。\n現在準備中です。",
  },
  {
    title: "必要なときのおとどけ",
    body: "必要な時だけ、どんぐり50こ（200円予定）や20こ（100円予定）を受け取れるように準備中です。",
  },
] as const;
