import Image from "next/image";

/**
 * マイページ見出し右上のフクロウ先生挿絵。
 * 外すときは orders/page.tsx からこの import と利用箇所を削除するだけでOK。
 */
export function MyPageHeaderIllustration() {
  return (
    <Image
      src="/decorations/owl-sensei-my-page-header.png"
      alt=""
      aria-hidden
      width={80}
      height={80}
      className="pointer-events-none h-14 w-14 shrink-0 select-none object-contain opacity-90 sm:h-20 sm:w-20"
    />
  );
}
