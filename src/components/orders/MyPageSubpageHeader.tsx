import Link from "next/link";

import { LOG_HOUSE_SHORT_LABEL } from "@/lib/journal/logHouseLabels";

type Props = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export function MyPageSubpageHeader({
  title,
  description,
  backHref = "/orders",
  backLabel = LOG_HOUSE_SHORT_LABEL,
}: Props) {
  return (
    <div>
      <Link href={backHref} className="text-sm text-stone-600 hover:text-stone-900">
        ← {backLabel}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{title}</h1>
      {description ? <p className="mt-1 text-sm text-stone-600">{description}</p> : null}
    </div>
  );
}
