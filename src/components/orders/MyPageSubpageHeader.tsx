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
      <Link
        href={backHref}
        className="text-sm text-[#7a6652] underline-offset-2 hover:text-[#3d3226] hover:underline"
      >
        ← {backLabel}
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-wide text-[#3d3226]">{title}</h1>
      {description ? <p className="mt-1 text-sm leading-relaxed text-[#6e5c48]">{description}</p> : null}
    </div>
  );
}
