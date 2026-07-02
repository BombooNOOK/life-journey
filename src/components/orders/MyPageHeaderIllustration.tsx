import Image from "next/image";

import { myPageActionIllustrations } from "@/lib/mypage/myPageActionAssets";

/** ログハウス見出し右上の挿絵 */
export function MyPageHeaderIllustration() {
  const illustration = myPageActionIllustrations.logHouse;
  return (
    <Image
      src={illustration.src}
      alt=""
      aria-hidden
      width={illustration.width}
      height={illustration.height}
      className="h-[3.25rem] w-auto select-none object-contain sm:h-[4.25rem]"
      priority
    />
  );
}
