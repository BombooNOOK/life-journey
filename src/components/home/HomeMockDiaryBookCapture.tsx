/** トップ用：製本イメージ（表紙正面・冊子感）の撮影ページ */
export function HomeMockDiaryBookCapture() {
  return (
    <div className="flex min-h-[28rem] items-center justify-center bg-gradient-to-b from-[#faf8f5] to-[#f3ece2] px-8 py-12">
      <img
        src="/images/home-mock/diary-book-product-source.png"
        alt="製本された Life Journey Diary"
        width={480}
        height={640}
        className="h-auto w-full max-w-[15rem] rounded-md object-contain shadow-[0_8px_28px_rgba(107,90,74,0.18)]"
      />
    </div>
  );
}
