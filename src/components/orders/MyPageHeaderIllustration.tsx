import Image from "next/image";

/**
 * マイページ見出し右上のフクロウ先生挿絵。
 * 外すときは orders/page.tsx からこの import と利用箇所を削除するだけでOK。
 */
export function MyPageHeaderIllustration() {
  return (
    <Image
      src="/decorations/owl-sensei-my-page-header.png?v=3"
      alt=""
      aria-hidden
      width={610}
      height={751}
      className="h-[3.25rem] w-auto select-none object-contain sm:h-[4.25rem]"
      priority
    />
  );
}
