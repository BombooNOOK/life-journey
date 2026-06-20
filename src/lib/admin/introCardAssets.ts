/** 対面紹介用カード（管理者ページ専用・public/images/admin/ に配置） */
export const ADMIN_INTRO_CARD_APP_SRC = "/images/admin/intro-card-app.png" as const;

export const ADMIN_INTRO_CARD_SHOP_SRC = "/images/admin/intro-card-shop.png" as const;

export type AdminIntroCardDefinition = {
  key: "app" | "shop";
  href: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  /** 縦長で幅が狭いカードは cover で画面いっぱいに */
  imageFit: "contain" | "cover";
};

export const ADMIN_INTRO_CARDS: readonly AdminIntroCardDefinition[] = [
  {
    key: "app",
    href: "/admin/intro-cards/app",
    title: "Life Journey Diary（アプリ）",
    description: "アプリの紹介カード。対面でそのまま見せられます。",
    imageSrc: ADMIN_INTRO_CARD_APP_SRC,
    imageAlt: "Life Journey Diary アプリ紹介カード",
    imageFit: "cover",
  },
  {
    key: "shop",
    href: "/admin/intro-cards/shop",
    title: "BambooNOOK ショップ",
    description: "ショップの紹介カード。対面でそのまま見せられます。",
    imageSrc: ADMIN_INTRO_CARD_SHOP_SRC,
    imageAlt: "BambooNOOK ショップ紹介カード",
    imageFit: "contain",
  },
] as const;

export function adminIntroCardByKey(key: string): AdminIntroCardDefinition | undefined {
  return ADMIN_INTRO_CARDS.find((card) => card.key === key);
}
