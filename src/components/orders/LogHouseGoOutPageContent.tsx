import { LogHouseGoOutDestinationList } from "@/components/orders/LogHouseGoOutDestinationCard";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { LOG_HOUSE_GO_OUT_PAGE_DESCRIPTION, LOG_HOUSE_GO_OUT_PAGE_TITLE } from "@/lib/loghouse/logHouseGoOutCopy";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";

type Props = {
  kanteiHallHref: string;
};

/** おでかけをするページ本文 */
export function LogHouseGoOutPageContent({ kanteiHallHref }: Props) {
  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title={LOG_HOUSE_GO_OUT_PAGE_TITLE}
        description={LOG_HOUSE_GO_OUT_PAGE_DESCRIPTION}
        backHref="/orders"
        backLabel={LOG_HOUSE_RETURN_TO_LABEL}
      />

      <LogHouseGoOutDestinationList kanteiHallHref={kanteiHallHref} />
    </div>
  );
}
