import { notFound } from "next/navigation";

import { buildGardenPreviewState } from "@/lib/garden/gardenPreviewFixture";

type Props = {
  searchParams?: Promise<{ view?: string }>;
};

/** 開発用プレビュー。本番ビルドでは notFound（重いクライアントを import しない） */
export default async function GardenPreviewPage({ searchParams }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = searchParams ? await searchParams : {};
  if (params.view === "immersive") {
    const { GardenMobileImmersive } = await import("@/components/orders/GardenMobileImmersive");
    return (
      <GardenMobileImmersive
        initialState={buildGardenPreviewState(0)}
        previewMode
        backHref="/preview/garden"
        layout="immersive"
      />
    );
  }

  const { GardenPreviewClient } = await import("@/components/orders/GardenPreviewClient");
  return <GardenPreviewClient />;
}
