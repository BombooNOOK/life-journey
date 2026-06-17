import { MyPageHeaderIllustration } from "@/components/orders/MyPageHeaderIllustration";

/** マイページ見出し */
export function MyPagePageHeader() {
  return (
    <div className="relative">
      <h1 className="pr-[3.75rem] text-[1.625rem] font-bold leading-tight text-stone-900 sm:pr-20 sm:text-2xl">
        マイページ
      </h1>
      <div className="pointer-events-none absolute -right-1 top-0 z-10">
        <MyPageHeaderIllustration />
      </div>
    </div>
  );
}
