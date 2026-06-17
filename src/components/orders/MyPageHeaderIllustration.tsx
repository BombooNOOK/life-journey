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
      width={682}
      height={1024}
      className="pointer-events-none h-[4.5rem] w-auto shrink-0 select-none object-contain opacity-95 sm:h-24"
      priority
    />
  );
}
