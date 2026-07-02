import { MyPageHeaderIllustration } from "@/components/orders/MyPageHeaderIllustration";
import { LOG_HOUSE_PAGE_TITLE, LOG_HOUSE_TAGLINE } from "@/lib/journal/logHouseLabels";

/** ログハウス（/orders）見出し */
export function MyPagePageHeader() {
  return (
    <div className="relative space-y-1">
      <h1 className="pr-[3.75rem] text-[1.625rem] font-bold leading-tight text-stone-900 sm:pr-20 sm:text-2xl">
        {LOG_HOUSE_PAGE_TITLE}
      </h1>
      <p className="text-sm text-stone-600">{LOG_HOUSE_TAGLINE}</p>
      <div className="pointer-events-none absolute -right-1 top-0 z-10">
        <MyPageHeaderIllustration />
      </div>
    </div>
  );
}
