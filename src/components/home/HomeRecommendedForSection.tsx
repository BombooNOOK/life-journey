import { CharacterFaceIcon, type CharacterFaceIconName } from "@/components/home/CharacterFaceIcon";
import { DecorationImage } from "@/components/ui/DecorationImage";
import type { DecorationName } from "@/lib/decorations/catalog";

type ConversationBlock = {
  characterFace: CharacterFaceIconName;
  worry: string;
  reply: string;
};

const OPENING_MESSAGE = "なんでもない日も、あとから見ると大切な一日かもしれないよ。";

const CLOSING_MESSAGE =
  "鑑定で見つけた小さな気づきが、\n日々を記録する中で、あなたらしい物語へ育っていきます。";

const WORRY_TEXT_CLASS =
  "text-sm font-semibold leading-6 text-stone-700 sm:text-[15px] sm:leading-7";
const REPLY_TEXT_CLASS =
  "text-sm leading-6 text-[#6B5A4A] sm:text-[15px] sm:leading-7";
const NARRATION_TEXT_CLASS =
  "min-w-0 flex-1 whitespace-pre-line text-sm leading-6 text-stone-600 sm:text-[15px] sm:leading-7";

const CONVERSATIONS: ConversationBlock[] = [
  {
    characterFace: "character-sloth-face",
    worry: "忙しい毎日の中で、自分のきもちを後回しにしがち…",
    reply: "ゆっくり自分に戻る時間があるといいね。",
  },
  {
    characterFace: "character-squirrel-face",
    worry: "手帳や日記を始めても、いつの間にか続かなくなってしまう…",
    reply: "書けた日だけ集めればいいんだよ。小さな一歩もちゃんと宝物。",
  },
  {
    characterFace: "character-hedgehog-face",
    worry: "SNSには書かない、小さな気づきや写真を残したい…",
    reply: "誰かに見せなくてもいいでしょ。大事なものは、そっとしまっておけばいいんだよ。",
  },
  {
    characterFace: "character-kerosion-face",
    worry: "何気ない毎日を、あとから大切に読み返したい…",
    reply: "今日の小さな光は、あとから意味を連れてくることがあるよ。",
  },
];

/** 冒頭・締め用：全身イラスト（案内役・やや大きめ） */
function FullCharacterIcon({
  name,
  className,
}: {
  name: DecorationName;
  className?: string;
}) {
  return (
    <DecorationImage
      name={name}
      size="lg"
      className={["mt-0.5 shrink-0 opacity-90", className].filter(Boolean).join(" ")}
      fallback={
        <span
          aria-hidden
          className={["inline-block h-[3.75rem] w-[3rem] shrink-0 rounded-full bg-stone-100/90", className]
            .filter(Boolean)
            .join(" ")}
        />
      }
    />
  );
}

function ConversationDivider() {
  return (
    <div className="my-3 flex items-center sm:my-3.5" aria-hidden>
      <div className="h-px w-full bg-emerald-900/10" />
    </div>
  );
}

/** 上段：キャラの悩み（左寄せ・丸顔アイコン左） */
function WorryLine({ icon, children }: { icon: CharacterFaceIconName; children: string }) {
  return (
    <div className="flex items-start gap-2.5 pr-6 sm:pr-10">
      <CharacterFaceIcon name={icon} />
      <p className={`min-w-0 flex-1 ${WORRY_TEXT_CLASS}`}>{children}</p>
    </div>
  );
}

/** 下段：フクロウ先生の返答（ボックス右寄せ・本文左揃え・アイコン右） */
function ReplyLine({ children }: { children: string }) {
  return (
    <div className="flex justify-end pl-6 sm:pl-10">
      <div className="flex max-w-[94%] items-start gap-2.5 rounded-xl bg-[#faf6ef]/85 px-3 py-2 sm:max-w-[90%]">
        <p className={`min-w-0 flex-1 text-left ${REPLY_TEXT_CLASS}`}>{children}</p>
        <CharacterFaceIcon name="character-owl-face" />
      </div>
    </div>
  );
}

/** 冒頭・締め：フクロウ先生が直接語りかける（返答ボックスなし） */
function FukuroNarrationLine({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={["flex items-start gap-3 sm:gap-3.5", className].filter(Boolean).join(" ")}
    >
      <FullCharacterIcon name="character-owl-gentle" />
      <p className={NARRATION_TEXT_CLASS}>{children}</p>
    </div>
  );
}

/** トップページ「こんな方におすすめ」（どうぶつ鑑定士の会話形式） */
export function HomeRecommendedForSection() {
  return (
    <section className="rounded-2xl border border-stone-200/75 bg-[#fdfaf4] p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold leading-snug text-stone-900">こんな方におすすめ</h2>

      <div className="mt-3 sm:mt-3.5">
        <FukuroNarrationLine>{OPENING_MESSAGE}</FukuroNarrationLine>
      </div>

      {CONVERSATIONS.map((block) => (
        <div key={block.characterFace}>
          <ConversationDivider />
          <div className="space-y-2.5 sm:space-y-3">
            <WorryLine icon={block.characterFace}>{block.worry}</WorryLine>
            <ReplyLine>{block.reply}</ReplyLine>
          </div>
        </div>
      ))}

      <ConversationDivider />
      <FukuroNarrationLine className="mt-1 sm:mt-1.5">{CLOSING_MESSAGE}</FukuroNarrationLine>
    </section>
  );
}
