import { notFound } from "next/navigation";

import {
  LogHouseRoomLayoutDebugClient,
  LogHouseRoomLayoutDebugLinks,
} from "./LogHouseRoomLayoutDebugClient";

export default function LogHouseRoomLayoutPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Dev layout tool</p>
        <h1 className="mt-2 text-xl font-semibold">ログハウス室内レイアウト定規</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          室内背景（576×1024）上の家具・タップ領域を測ります。値は{" "}
          <code className="rounded bg-stone-200 px-1">src/lib/loghouse/logHouseRoomLayout.ts</code> と{" "}
          <code className="rounded bg-stone-200 px-1">src/lib/loghouse/logHouseRoomHotspots.ts</code>{" "}
          を編集してください。
        </p>

        <div className="mt-8">
          <LogHouseRoomLayoutDebugClient />
        </div>

        <LogHouseRoomLayoutDebugLinks />
      </div>
    </div>
  );
}
