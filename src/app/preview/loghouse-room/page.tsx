import { notFound } from "next/navigation";

import { LogHouseRoomPreviewClient } from "@/components/orders/loghouse-room/LogHouseRoomPreviewClient";
import type { LogHouseRoomTimeOfDay } from "@/lib/loghouse/logHouseRoomTimeTheme";

type Props = {
  searchParams?: Promise<{ view?: string; theme?: string }>;
};

function parseTheme(raw: string | undefined): LogHouseRoomTimeOfDay | undefined {
  if (raw === "day" || raw === "night") return raw;
  return undefined;
}

export default async function LogHouseRoomPreviewPage({ searchParams }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = searchParams ? await searchParams : {};
  const layout = params.view === "immersive" ? "immersive" : "framed";
  const timeOfDayOverride = parseTheme(params.theme);

  return (
    <LogHouseRoomPreviewClient layout={layout} timeOfDayOverride={timeOfDayOverride} />
  );
}
