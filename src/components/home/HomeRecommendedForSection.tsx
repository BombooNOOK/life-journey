import { DecorationImage } from "@/components/ui/DecorationImage";
import type { DecorationName } from "@/lib/decorations/catalog";

type ConversationBlock = {
  character: DecorationName;
  worry: string;
  reply: string;
};

const OPENING_MESSAGE = "なんでもない日も、あとから見ると大切な一日かもしれないよ。";

const CLOSING_MESSAGE = "鑑定で見つけたことを、日々の記録の中で少しずつ育てていこうね。";

const WORRY_TEXT_CLASS = "text-sm leading-6 text-stone-700 sm:text-[15px] sm:leading-7";
const REPLY_TEXT_CLASS =
  "text-sm leading-6 text-[#6B5A4A] sm:text-[15px] sm:leading-7";

const CONVERSATIONS: ConversationBlock[] = [
  {
    character: "character-sloth-worried",
    worry: "忙しい毎日の中で、自分のきもちを後回しにしがち",
    reply: "ゆっくり自分に戻る時間があるといいね。",
  },
  {
    character: "character-squirrel-thinking",
    worry: "手帳や日記を始めても、いつの間にか続かなくなってしまう",
    reply: "書けた日だけ集めればいいんだよ。小さな一歩もちゃんと宝物。",
  },
  {
    character: "character-hedgehog-worried",
    worry: "SNSには書かない、小さな気づきや写真を残したい",
    reply: "誰かに見せなくてもいいでしょ。大事なものは、そっとしまっておけばいいんだよ。",
  },
  {
    character: "character-kerosion-mystic",
    worry: "何気ない毎日を、あとから大切に読み返したい",
    reply: "今日の小さな光は、あとから意味を連れてくることがあるよ。",
  },
];

function CharacterIcon({ name, className }: { name: DecorationName; className?: string }) {
  return (
    <DecorationImage
      name={name}
      size="sm"
      className={["mt-0.5 shrink-0 opacity-90", className].filter(Boolean).join(" ")}
      fallback={
        <span
          aria-hidden
          className={["inline-block h-9 w-8 shrink-0 rounded-full bg-stone-100/90", className]
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

/** 上段：キャラの悩み（左寄せ・アイコン左） */
function WorryLine({ icon, children }: { icon: DecorationName; children: string }) {
  return (
    <div className="flex items-start gap-2.5 pr-6 sm:pr-10">
      <CharacterIcon name={icon} />
      <p className={`min-w-0 flex-1 ${WORRY_TEXT_CLASS}`}>{children}</p>
    </div>
  );
}

/** 下段：フクロウ先生の返答（右寄せ・アイコン右） */
function ReplyLine({ children }: { children: string }) {
  return (
    <div className="flex justify-end pl-6 sm:pl-10">
      <div className="flex max-w-[94%] items-start gap-2.5 rounded-xl bg-[#faf6ef]/85 px-3 py-2 sm:max-w-[90%]">
        <p className={`min-w-0 flex-1 text-right ${REPLY_TEXT_CLASS}`}>{children}</p>
        <CharacterIcon name="character-owl-gentle" />
      </div>
    </div>
  );
}

/** 冒頭・締めのフクロウメッセージ（左寄せ） */
function OpeningLine({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-2.5 pr-6 sm:pr-10">
      <CharacterIcon name="character-owl-gentle" />
      <p className={`min-w-0 flex-1 text-sm leading-6 text-stone-600 sm:text-[15px] sm:leading-7`}>
        {children}
      </p>
    </div>
  );
}

/** トップページ「こんな方におすすめ」（どうぶつ鑑定士の会話形式） */
export function HomeRecommendedForSection() {
  return (
    <section className="rounded-2xl border border-stone-200/75 bg-[#fdfaf4] p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold leading-snug text-stone-900">こんな方におすすめ</h2>

      <div className="mt-3 sm:mt-3.5">
        <OpeningLine>{OPENING_MESSAGE}</OpeningLine>
      </div>

      {CONVERSATIONS.map((block) => (
        <div key={block.character}>
          <ConversationDivider />
          <div className="space-y-2.5 sm:space-y-3">
            <WorryLine icon={block.character}>{block.worry}</WorryLine>
            <ReplyLine>{block.reply}</ReplyLine>
          </div>
        </div>
      ))}

      <ConversationDivider />
      <ReplyLine>{CLOSING_MESSAGE}</ReplyLine>
    </section>
  );
}
