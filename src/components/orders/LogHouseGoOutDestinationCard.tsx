"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { FOREST_MAP_SRC } from "@/lib/help/forestMapAssets";
import {
  LOG_HOUSE_GO_OUT_DESTINATIONS,
  type LogHouseGoOutDestination,
  type LogHouseGoOutDestinationIcon,
} from "@/lib/loghouse/logHouseGoOutDestinations";
import { FOREST_BUILDING_SRC } from "@/lib/onboarding/firstVisitWizard/forestBuildingAssets";

type Props = {
  destination: LogHouseGoOutDestination;
  href: string;
};

function destinationIconSrc(icon: LogHouseGoOutDestinationIcon): string {
  if (typeof icon === "object") return icon.src;
  if (icon === "forestMap") return FOREST_MAP_SRC;
  return FOREST_BUILDING_SRC[icon];
}

function destinationIconAlt(destination: LogHouseGoOutDestination): string {
  if (destination.icon === "forestMap") return "森の地図";
  return destination.title;
}

function isCustomOrMapIcon(icon: LogHouseGoOutDestinationIcon): boolean {
  return typeof icon === "object" || icon === "forestMap";
}

/** おでかけページ：行き先カード */
export function LogHouseGoOutDestinationCard({ destination, href }: Props) {
  const iconSrc = destinationIconSrc(destination.icon);
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <article className="rounded-2xl border border-[#e8dfd0]/90 bg-[#fffdf9] p-3.5 shadow-sm sm:p-4">
      <div className="flex items-start gap-3">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f3f0e6] sm:h-[4.5rem] sm:w-[4.5rem]">
          {!iconFailed ? (
            <Image
              src={iconSrc}
              alt={destinationIconAlt(destination)}
              fill
              sizes="72px"
              className="object-contain object-center p-1"
              unoptimized={isCustomOrMapIcon(destination.icon)}
              onError={() => setIconFailed(true)}
            />
          ) : (
            <span className="px-1 text-center text-[10px] leading-tight text-stone-500">
              {destination.title}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-base font-semibold text-stone-900">{destination.title}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600">
            {destination.description}
          </p>
          <Link
            href={href}
            className="inline-flex min-h-[40px] items-center text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            {destination.actionLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

type ListProps = {
  kanteiHallHref: string;
};

/** おでかけページ：行き先一覧 */
export function LogHouseGoOutDestinationList({ kanteiHallHref }: ListProps) {
  return (
    <ul className="space-y-3">
      {LOG_HOUSE_GO_OUT_DESTINATIONS.map((destination) => {
        const href =
          destination.route === "kanteiHall" ? kanteiHallHref : destination.route;

        return (
          <li key={destination.id}>
            <LogHouseGoOutDestinationCard destination={destination} href={href} />
          </li>
        );
      })}
    </ul>
  );
}
