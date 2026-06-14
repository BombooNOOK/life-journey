type FaqItem = {
  question: string;
  paragraphs: string[];
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "日記の内容は、他の人に見られたりしませんか？",
    paragraphs: [
      "ご安心ください。Life Journey Diaryには、他の人に日記が公開されるタイムラインや共有機能はありません。",
      "あなたがつづった日記や写真は、基本的にご本人だけが見返すための記録です。他人の目を気にせず、本音や小さなできごとを残せる、あなただけの「ひみつの隠れ家」のようにお使いください。",
      "なお、日記ブックをご注文いただく場合は、製本用のPDFデータを作成・印刷手配のために扱いますが、運営側で日記の内容を読んで添削・確認することはありません。誤字や写真の配置、掲載内容は、必ずご注文前にアプリ内のプレビューでご確認ください。",
    ],
  },
  {
    question: "2週間の無料期間がすぎたら、自動でお金が引かれてしまいますか？",
    paragraphs: [
      "いいえ、自動で課金されることはありません。",
      "最初に必要なのは、お名前と生年月日、メールアドレスの登録だけです。クレジットカード情報の入力は不要です。",
      "2週間のお試し期間がすぎたあとも、ご自身で有料プランへ進むお手続きをしない限り、料金が発生することはありません。まずは安心して、鑑定と日記の記録をお試しください。",
    ],
  },
  {
    question: "三日坊主で、毎日日記を書ける自信がないのですが……",
    paragraphs: [
      "毎日書かなくても大丈夫です。",
      "Life Journey Diaryは、書かなかった日が白紙で残る日記帳ではなく、書いた日だけが少しずつ積み重なっていく記録です。",
      "1行だけでも、写真だけでも、残したい日だけで大丈夫。あなたのペースで、思い出をそっと残していけます。",
    ],
  },
  {
    question: "製本（日記ブック）は、絶対に注文しないといけませんか？",
    paragraphs: [
      "いいえ、製本は必須ではありません。",
      "まずはアプリの中で、デジタル日記として楽しんでいただくだけでも大丈夫です。日々の記録が少しずつたまってきて、「この時間を手元に残したいな」と思ったタイミングで、日記ブックとしてご注文いただけます。",
      "デジタルで気軽に残した毎日が、いつか一冊の本になる。その楽しみを、まずはアプリの中で感じてみてください。",
    ],
  },
];

/** トップ：クロージング前の折りたたみ式よくある質問 */
export function HomeFaqSection() {
  return (
    <section className="rounded-2xl border border-stone-200/70 bg-[#faf8f5] px-4 py-6 sm:px-5 sm:py-7">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-base font-semibold leading-snug text-stone-900 sm:text-[1.05rem]">
          よくある質問
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-stone-600 sm:text-sm">
          はじめる前に気になりやすいことをまとめました。
        </p>

        <div className="mt-4 space-y-2 sm:mt-5">
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group rounded-xl border border-stone-200/80 bg-[#fffdf9]/90 shadow-[0_1px_0_rgba(92,74,58,0.04)]"
            >
              <summary className="cursor-pointer list-none px-3.5 py-3.5 text-[13px] font-semibold leading-snug text-[#5c4a3a] marker:content-none sm:px-4 sm:py-4 sm:text-sm [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="mr-1.5 text-emerald-800/85">Q.</span>
                    {item.question}
                  </span>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-xs font-normal text-stone-400 transition group-open:rotate-180"
                  >
                    ▼
                  </span>
                </span>
              </summary>
              <div className="space-y-2.5 border-t border-stone-200/70 px-3.5 pb-3.5 pt-3 text-[13px] leading-[1.7] text-[#6b5a4a] sm:px-4 sm:pb-4 sm:text-sm sm:leading-7">
                {item.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
