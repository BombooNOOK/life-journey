import Image from "next/image";

import {
  HOME_APPRAISER_PROFILE_CARDS,
  type HomeAppraiserProfileCard,
} from "@/lib/home/homeAppraiserProfileCards";

const PROFILE_NAME_CLASS =
  "w-full text-[16px] font-semibold leading-tight tracking-wide text-[#5c4a3a]";
const PROFILE_CATCHPHRASE_CLASS =
  "mt-2.5 w-full text-[13px] leading-snug text-[#6b5a4a] sm:mt-3";

/** 下端説明文：小さいスマホは現状維持、大きいスマホだけ少し下げてイラストと被りにくくする */
const PROFILE_TOP_BLOCK_CLASS =
  "lj-reading-exempt absolute left-[8%] right-[8%] top-[7%] z-10 text-center min-[390px]:top-[9%] min-[430px]:top-[9.5%]";
const PROFILE_BOTTOM_BLOCK_CLASS =
  "lj-reading-exempt absolute bottom-[8%] left-[9%] right-[9%] z-10 text-center min-[390px]:bottom-[5.5%] min-[430px]:bottom-[5%]";

/** ケロシオン：イラストが縦長のため、他カードより少し下げる */
const PROFILE_TOP_BLOCK_KEROSION_CLASS =
  "lj-reading-exempt absolute left-[8%] right-[8%] top-[8.5%] z-10 text-center min-[390px]:top-[10.5%] min-[430px]:top-[11%]";
const PROFILE_BOTTOM_BLOCK_KEROSION_CLASS =
  "lj-reading-exempt absolute bottom-[7%] left-[9%] right-[9%] z-10 text-center min-[390px]:bottom-[4.5%] min-[430px]:bottom-[4%]";

const PROFILE_DESCRIPTION_CLASS =
  "w-full text-[12px] leading-[1.75] text-[#5c4a3a]/92";

function profileTopBlockClass(cardId: HomeAppraiserProfileCard["id"]): string {
  return cardId === "kerosion" ? PROFILE_TOP_BLOCK_KEROSION_CLASS : PROFILE_TOP_BLOCK_CLASS;
}

function profileBottomBlockClass(cardId: HomeAppraiserProfileCard["id"]): string {
  return cardId === "kerosion" ? PROFILE_BOTTOM_BLOCK_KEROSION_CLASS : PROFILE_BOTTOM_BLOCK_CLASS;
}

function AppraiserProfileCard({ card }: { card: HomeAppraiserProfileCard }) {
  return (
    <article className="mx-auto w-full max-w-[20rem]">
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={card.imageSrc}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, 20rem"
          className="z-0 object-cover object-center"
        />

        <div className={profileTopBlockClass(card.id)}>
          <h3 className={PROFILE_NAME_CLASS}>{card.name}</h3>
          <p className={PROFILE_CATCHPHRASE_CLASS}>{card.catchphrase}</p>
        </div>

        <div className={profileBottomBlockClass(card.id)}>
          <p className={PROFILE_DESCRIPTION_CLASS}>{card.description}</p>
        </div>
      </div>

      <p className="sr-only">
        {card.imageAlt}。{card.name}。{card.catchphrase}。{card.description}
      </p>
    </article>
  );
}

/** トップ：森のどうぶつ鑑定士プロフィールカード */
export function HomeAppraiserProfilesSection() {
  const lastIndex = HOME_APPRAISER_PROFILE_CARDS.length - 1;

  return (
    <section className="rounded-2xl border border-stone-200/75 bg-[#fdfaf4] p-4 shadow-sm sm:p-5">
      <div className="mx-auto max-w-2xl text-center md:text-left">
        <h2 className="text-base font-semibold leading-snug text-stone-900">
          森のどうぶつ鑑定士たち
        </h2>
        <p className="mt-1 text-[13px] text-amber-700/55" aria-hidden>
          ✦
        </p>
        <p className="lj-read-desc mt-2 leading-5 text-stone-600 sm:leading-6">
          あなたの数字や日々の記録に、森のどうぶつ鑑定士たちがそっと寄り添います。
          <br className="hidden sm:block" />
          その日の気持ちに合わせて、やさしい言葉を届けてくれる仲間たちです。
        </p>
      </div>

      <div className="mx-auto mt-6 grid w-full max-w-3xl grid-cols-1 gap-8 sm:mt-7 md:grid-cols-2 md:gap-x-6 md:gap-y-9">
        {HOME_APPRAISER_PROFILE_CARDS.map((card, index) => (
          <div
            key={card.id}
            className={
              index === lastIndex ? "w-full md:col-span-2 md:flex md:justify-center" : "w-full"
            }
          >
            <AppraiserProfileCard card={card} />
          </div>
        ))}
      </div>
    </section>
  );
}
