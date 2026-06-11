import type { Metadata } from "next";
import Link from "next/link";

import { LinkToOperationGuide } from "@/components/guide/GuideCrossLinks";
import { AcornBulletList } from "@/components/content/AcornBulletList";
import { RecommendedForSection } from "@/components/content/RecommendedForSection";
import { PageTitleWithAccent } from "@/components/ui/PageTitleWithAccent";
import { SoftIllustrationAccent } from "@/components/ui/SoftIllustrationAccent";
import { SoftSectionDivider } from "@/components/ui/SoftSectionDivider";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Life Journey Diaryの歩き方",
};

function ProseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight text-stone-900">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-stone-700 sm:text-[15px] sm:leading-8">
        {children}
      </div>
    </section>
  );
}

const CAN_DO_ITEMS = [
  "その日の気分を選ぶ",
  "今日の出来事や気持ちを書く",
  "1日1枚、写真を一緒に残す",
  "記録した日をカレンダーや月別一覧で確認する",
  "日記や鑑定書を本棚に保存し、いつでも読み返す",
] as const;

export default function DiaryGuidePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <PageTitleWithAccent
        tone="diary"
        decoration="owl-md"
        title="Life Journey Diaryの歩き方"
        backLink={{ href: "/orders", label: "← マイページ" }}
        description={
          <>
            <p>ここは、数字で紡ぐ人生の旅を、鑑定書と日記のふたつで支える場所です。</p>
            <p className="mt-3">
              Life Journey Diaryは、鑑定書を読むだけで終わる場所ではありません。日々の出来事や気持ちを重ねながら、自分だけの一冊を育てていくための場所です。
            </p>
          </>
        }
      />

      <section className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm sm:rounded-3xl sm:p-6">
        <p className="relative z-10 text-lg font-semibold leading-relaxed text-emerald-950">
          なんでもないような日でも、意味があった。
        </p>
        <p className="relative z-10 mt-3 text-sm leading-7 text-stone-700 sm:text-[15px] sm:leading-8">
          その日を過ごしたあなたの言葉を、未来のあなたへそっと残していきます。
        </p>
        <p className="relative z-10 mt-3 text-sm leading-7 text-stone-700 sm:text-[15px] sm:leading-8">
          Life Journey Diary は、毎日の気持ちや出来事を、そっと書き残していく日記です。
          特別なことがあった日だけでなく、いつも通りに過ぎていった日も、少し疲れていた日も、なんとなく心が動いた日も。
        </p>
        <p className="relative z-10 mt-3 text-sm leading-7 text-stone-700 sm:text-[15px] sm:leading-8">
          Life Journey Diary は、あなたの毎日を評価したり、正解に導いたりする場所ではありません。今日という一日を、あなた自身の言葉で残していくための場所です。
        </p>
      </section>

      <div className="space-y-2 rounded-2xl border border-emerald-100/80 bg-[#fdfaf4]/80 p-5 sm:space-y-0 sm:p-6">
        <ProseSection title="できること">
          <p>日々の記録をつけながら、あなたの歩みを少しずつ残していくことができます。</p>
          <AcornBulletList items={CAN_DO_ITEMS} />
          <p>
            長い文章を書かなくても大丈夫です。一言だけでも、短いメモでも。その日の自分が残した言葉には、あとから意味が宿ることがあります。
          </p>
          <p className="text-xs text-stone-500">
            画面の操作手順は
            <Link href="/guide" className="mx-0.5 text-emerald-900 hover:underline">
              使い方
            </Link>
            をご覧ください。
          </p>
        </ProseSection>

        <SoftSectionDivider variant="leaf" />

        <ProseSection title="まずは無料鑑定から">
          <p>
            Life Journey Diary では、はじめに無料鑑定を行います。
            これは鑑定書を作成するためだけでなく、日記に添えられるフクロウ先生からのメッセージを、あなたの数字に合わせて届けるための大切な準備です。
          </p>
          <p>
            まずは無料鑑定で、あなたの数字を知るところから。そこから、あなたに寄り添う Life Journey Diary が始まります。
          </p>
        </ProseSection>

        <SoftSectionDivider variant="star" />

        <section className="relative rounded-2xl border border-amber-100 bg-amber-50/30 p-5 sm:p-6">
          <div className="pointer-events-none absolute right-4 top-4 hidden select-none sm:flex sm:items-center sm:gap-2">
            <SoftIllustrationAccent variant="moon" size="sm" tone="amber" />
            <SoftIllustrationAccent variant="book" size="sm" tone="amber" />
            <span className="text-xs tracking-wide text-amber-800/40">点と線</span>
          </div>
          <h2 className="pr-2 text-base font-semibold tracking-tight text-stone-900">
            鑑定書と日記は、どうつながるの？
          </h2>
          <p className="mt-3 text-sm font-medium leading-7 text-amber-900/80 sm:text-[15px]">
            鑑定書は、遠くから見た地図。日記は、足元に残していく小さな足あと。
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-stone-700 sm:text-[15px] sm:leading-8">
            <p>
              鑑定書は、あなたの数字から、生まれ持った性質や心の奥にある願い、人生の流れを読み解いていくものです。あなたという人の中に流れている、大きな道すじを知るための地図のようなものかもしれません。
            </p>
            <p>
              一方で、日記は、その日その日の出来事や気持ちを残していくものです。うれしかったこと、少し疲れていたこと、誰かの言葉が心に残ったこと、何もなかったように見えたけれど、なんとなく忘れたくなかったこと。
            </p>
            <p>
              一日一日の記録は、小さな点のように見えることがあります。けれど続けていくうちに、その点と点がつながり、やがて自分の歩いてきた道が少しずつ見えてくることがあります。
            </p>
            <p>
              鑑定書は、大きな流れを知るために。日記は、その流れの中にある今日を残すために。
              遠くから見た地図と、足元に残していく小さな足あと。その二つが重なったとき、なんでもないように思えた一日にも、あとから意味が宿っていたことに気づくかもしれません。
            </p>
          </div>
        </section>

        <SoftSectionDivider variant="footprints" />

        <ProseSection title="毎日書かなくても大丈夫です">
          <p>
            日記というと、「毎日書かなきゃ」「続けなきゃ」と思ってしまう方もいるかもしれません。
            でも Life Journey Diary では、毎日きれいに書き続けることよりも、書きたいと思った日に、今の自分の言葉を残すことを大切にしています。
          </p>
          <p>
            忙しい日は、一言だけでも大丈夫です。何も書けない日があっても大丈夫です。間が空いてしまっても、また戻ってくれば大丈夫です。
            日記は、あなたのそばで、静かに待っていてくれる場所です。
          </p>
        </ProseSection>

        <SoftSectionDivider variant="leaf" />

        <ProseSection title="インストール不要で、すぐに使えます">
          <p>
            Life Journey Diary は、スマホやパソコンのブラウザから使えるウェブアプリです。アプリストアからのインストールは必要ありません。
            URLを開いてログインすれば、そのまま日記を書いたり、鑑定書を読み返したりできます。
          </p>
          <p>
            スマホのホーム画面に追加しておくと、アプリのような感覚で毎日の記録を開きやすくなります。
          </p>
        </ProseSection>

        <SoftSectionDivider variant="moon" />

        <ProseSection title="おすすめの使い方">
          <ol className="list-inside list-decimal space-y-3 text-stone-700">
            <li>
              <span className="font-medium text-stone-800">まずは「今日の気分」だけ選んでみる</span>
              <span className="mt-1 block">
                書くことが思いつかない日は、気分を選ぶだけでも十分です。小さな選択から、今日の自分の状態に気づけることがあります。
              </span>
            </li>
            <li>
              <span className="font-medium text-stone-800">一言だけ書いてみる</span>
              <span className="mt-1 block">
                「今日は少し眠かった」「夕方の空がきれいだった」——短い言葉でも、あとからその日の空気を思い出すきっかけになります。
              </span>
            </li>
            <li>
              <span className="font-medium text-stone-800">フクロウ先生の言葉を受け取る</span>
              <span className="mt-1 block">
                記録に寄り添う言葉が添えられます。「こうしなさい」と決めつけるものではなく、今日のあなたをやさしく受け取るためのメッセージです。
              </span>
            </li>
            <li>
              <span className="font-medium text-stone-800">本棚から鑑定書を読み返す</span>
              <span className="mt-1 block">
                気になったときに開き、日記を書く前に自分のテーマを確認する。時間が経ってから読み返すと、今の自分にすっと入ってくる言葉があるかもしれません。
              </span>
            </li>
            <li>
              <span className="font-medium text-stone-800">記録した日をカレンダーや月別一覧で見返す</span>
              <span className="mt-1 block">
                続けていくと、その月の流れが見えてきます。「おだやかな日が多かった」「少し疲れが出やすかった」——自分のリズムを少しずつ受け取れるようになります。
              </span>
            </li>
          </ol>
        </ProseSection>

        <SoftSectionDivider variant="star" />

        <ProseSection title="特別な日も、なんでもない日も">
          <p>
            Life Journey Diary は、特別な日だけのための日記ではありません。
            もちろん、大切な記念日や人生の節目は、深く心に残る日になるかもしれません。でも、何も起きなかったように見える日にも、あとから思えば大切な意味があった、ということがあります。
          </p>
          <p>
            少し疲れていた日、誰かの言葉が心に残った日、何気ない景色にほっとした日、何もできなかったけれど、ちゃんと過ごした日。そういう日々も、あなたの人生の一部です。
          </p>
        </ProseSection>

        <SoftSectionDivider variant="leaf" />

        <RecommendedForSection />

        <SoftSectionDivider variant="moon" />

        <ProseSection title="最後に">
          <p>
            Life Journey Diary は、完璧な毎日を記録するための場所ではありません。
            うまくいった日も、少し立ち止まった日も、何もなかったように見える日も。その日を過ごしたあなたの言葉には、きっと何かが残っています。
          </p>
          <p className="text-stone-800">
            なんでもないような日でも、意味があった。
            <br />
            いつかそう思えるように、今日の小さな記録を、ここに残してみてください。
          </p>
        </ProseSection>
      </div>

      <LinkToOperationGuide />
    </div>
  );
}
