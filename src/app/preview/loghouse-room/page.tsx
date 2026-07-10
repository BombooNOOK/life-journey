import { notFound } from "next/navigation";

import { LogHouseRoomPreviewClient } from "@/components/orders/loghouse-room/LogHouseRoomPreviewClient";

export default function LogHouseRoomPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <LogHouseRoomPreviewClient />;
}
