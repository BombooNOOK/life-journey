/** トップ：ヒーロー直下のサービス説明カード */
export function HomeAboutSection() {
  return (
    <section
      className="rounded-2xl border border-stone-200/75 bg-[#fffdf9] p-4 shadow-sm sm:p-5"
      aria-labelledby="home-about-heading"
    >
      <h2
        id="home-about-heading"
        className="text-base font-semibold leading-snug text-stone-900 sm:text-[1.05rem]"
      >
        Life Journey Diaryとは
      </h2>
      <div className="lj-read-desc mt-3 space-y-2 leading-[1.55] text-stone-600 sm:mt-3.5 sm:leading-7">
        <p>
          Life Journey Diaryは、
          <br className="sm:hidden" />
          森のどうぶつ鑑定士たちと
          <br className="block md:hidden" />
          日々のきもちをやさしくひも解き、
          <br />
          あなたのことばや写真とともに記録します。
        </p>
        <p>
          そして、デジタルで残した日々を、手元に残る
          <br />
          <span className="font-semibold text-stone-700">世界に一冊の「日記ブック」</span>へと
          <br className="block md:hidden" />
          育てていくサービスです。
        </p>
      </div>
    </section>
  );
}
