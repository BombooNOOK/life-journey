import { notFound } from "next/navigation";

import { LogHouseRoomPreviewClient } from "@/components/orders/loghouse-room/LogHouseRoomPreviewClient";

type Props = {
  searchParams?: Promise<{ view?: string }>;
};

export default async function LogHouseRoomPreviewPage({ searchParams }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = searchParams ? await searchParams : {};
  const layout = params.view === "immersive" ? "immersive" : "framed";

  return <LogHouseRoomPreviewClient layout={layout} />;
}
