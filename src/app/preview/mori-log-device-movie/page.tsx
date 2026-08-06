import { notFound } from "next/navigation";

import { MoriLogDeviceMovieEncodePreviewClient } from "@/app/preview/mori-log-device-movie/MoriLogDeviceMovieEncodePreviewClient";

export default function MoriLogDeviceMovieEncodePreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="min-h-[100dvh] bg-[#f3ebe0]">
      <MoriLogDeviceMovieEncodePreviewClient />
    </main>
  );
}
