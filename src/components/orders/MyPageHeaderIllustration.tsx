import Image from "next/image";

/**
 * ログハウス見出し右上のフクロウ先生挿絵（どうぶつ鑑定士といっしょに書く）。
 */
export function MyPageHeaderIllustration() {
  return (
    <Image
      src="/images/mypage/mypage_action_write_companion.png?v=1"
      alt=""
      aria-hidden
      width={1024}
      height={1024}
      className="h-[3.25rem] w-auto select-none object-contain sm:h-[4.25rem]"
      priority
    />
  );
}
