/**
 * トップ「森のどうぶつ鑑定士たち」セクション用データ。
 *
 * 差し替え手順：`public/images/profile-cards/` 内の同名 PNG を上書きするだけでOK。
 *
 * 推奨サイズ（目安）：
 * - 縦横比 2:3（例：682×1024px）
 * - 幅 650〜800px（Retina 表示向け）
 */
export const HOME_APPRAISER_PROFILE_IMAGES = {
  owl: "/images/profile-cards/profile-card-owl.png",
  sloth: "/images/profile-cards/profile-card-sloth.png",
  squirrel: "/images/profile-cards/profile-card-squirrel.png",
  kerosion: "/images/profile-cards/profile-card-kerosion.png",
  hedgehog: "/images/profile-cards/profile-card-hedgehog.png",
} as const;

export type HomeAppraiserProfileCard = {
  id: keyof typeof HOME_APPRAISER_PROFILE_IMAGES;
  name: string;
  catchphrase: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export const HOME_APPRAISER_PROFILE_CARDS: HomeAppraiserProfileCard[] = [
  {
    id: "owl",
    name: "フクロウ先生",
    catchphrase: "数字と言葉をつなぐ、森の案内役",
    description:
      "数秘のことばを手がかりに、あなたの毎日をやさしく見守りながら、人生の記録を物語へと導いてくれます。",
    imageSrc: HOME_APPRAISER_PROFILE_IMAGES.owl,
    imageAlt: "フクロウ先生のプロフィールカード",
  },
  {
    id: "sloth",
    name: "ナマケモノくん",
    catchphrase: "がんばりすぎる心を、ゆっくりほどくひと",
    description:
      "忙しい毎日のなかでも、自分の気持ちを大切にする時間を、そっと思い出させてくれます。",
    imageSrc: HOME_APPRAISER_PROFILE_IMAGES.sloth,
    imageAlt: "ナマケモノくんのプロフィールカード",
  },
  {
    id: "squirrel",
    name: "リスくん",
    catchphrase: "小さな一歩を、明るく応援してくれる相棒",
    description:
      "続かない日があっても大丈夫。小さな記録を楽しく積み重ねる力を、明るく後押ししてくれます。",
    imageSrc: HOME_APPRAISER_PROFILE_IMAGES.squirrel,
    imageAlt: "リスくんのプロフィールカード",
  },
  {
    id: "kerosion",
    name: "ケロシオン",
    catchphrase: "心の奥にある声を、静かに照らす旅人",
    description:
      "小さな気づきや、言葉にならない想いを静かに見つめながら、内側の物語を照らしてくれます。",
    imageSrc: HOME_APPRAISER_PROFILE_IMAGES.kerosion,
    imageAlt: "ケロシオンのプロフィールカード",
  },
  {
    id: "hedgehog",
    name: "ハリネズミくん",
    catchphrase: "不器用だけどやさしい、照れ屋な見守り役",
    description:
      "何気ない毎日にも価値があることを、少し照れながらも、ちゃんと伝えてくれる存在です。",
    imageSrc: HOME_APPRAISER_PROFILE_IMAGES.hedgehog,
    imageAlt: "ハリネズミくんのプロフィールカード",
  },
];
