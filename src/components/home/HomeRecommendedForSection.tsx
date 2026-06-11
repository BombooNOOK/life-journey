import { DecorationImage } from "@/components/ui/DecorationImage";
import type { DecorationName } from "@/lib/decorations/catalog";

type ConversationBlock = {
  character: DecorationName;
  worry: string;
  reply: string;
};

const OPENING_MESSAGE = "なんでもない日も、あとから見ると大切な一日かもしれないよ。";

const CLOSING_MESSAGE = "鑑定で見つけたことを、日々の記録の中で少しずつ育てていこうね。";

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

function CharacterIconFallback({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={["inline-block h-9 w-8 shrink-0 rounded-full bg-stone-100/90", className]
        .filter(Boolean)
        .join(" ")}
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

type ConversationLineProps = {
  icon: DecorationName;
  children: string;
  variant: "opening" | "worry" | "reply" | "closing";
};

function ConversationLine({ icon, children, variant }: ConversationLineProps) {
  const textClass =
    variant === "worry"
      ? "text-sm leading-6 text-stone-700 sm:text-[15px] sm:leading-7"
      : variant === "opening"
        ? "text-sm leading-6 text-stone-600 sm:text-[15px] sm:leading-7"
        : "text-xs leading-5 text-stone-500 sm:text-[13px] sm:leading-6";

  return (
    <div className="flex items-start gap-2.5">
      <DecorationImage
        name={icon}
        size="sm"
        className="mt-0.5 shrink-0 opacity-90"
        fallback={<CharacterIconFallback className="mt-0.5" />}
      />
      <p className={`min-w-0 flex-1 ${textClass}`}>{children}</p>
    </div>
  );
}

/** トップページ「こんな方におすすめ」（どうぶつ鑑定士の会話形式） */
export function HomeRecommendedForSection() {
  return (
    <section className="rounded-2xl border border-stone-200/75 bg-[#fdfaf4] p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold leading-snug text-stone-900">こんな方におすすめ</h2>

      <div className="mt-3 sm:mt-3.5">
        <ConversationLine icon="character-owl-gentle" variant="opening">
          {OPENING_MESSAGE}
        </ConversationLine>
      </div>

      {CONVERSATIONS.map((block) => (
        <div key={block.character}>
          <ConversationDivider />
          <div className="space-y-2 sm:space-y-2.5">
            <ConversationLine icon={block.character} variant="worry">
              {block.worry}
            </ConversationLine>
            <ConversationLine icon="character-owl-gentle" variant="reply">
              {block.reply}
            </ConversationLine>
          </div>
        </div>
      ))}

      <ConversationDivider />
      <ConversationLine icon="character-owl-gentle" variant="closing">
        {CLOSING_MESSAGE}
      </ConversationLine>
    </section>
  );
}
