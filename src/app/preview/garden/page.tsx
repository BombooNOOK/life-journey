import { notFound } from "next/navigation";

import { GardenPreviewClient } from "@/components/orders/GardenPreviewClient";
import { GardenMobileImmersive } from "@/components/orders/GardenMobileImmersive";
import { buildGardenPreviewState } from "@/lib/garden/gardenPreviewFixture";

type Props = {
  searchParams?: Promise<{ view?: string }>;
};

export default async function GardenPreviewPage({ searchParams }: Props) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = searchParams ? await searchParams : {};
  if (params.view === "immersive") {
    return (
      <GardenMobileImmersive
        initialState={buildGardenPreviewState(0)}
        previewMode
        backHref="/preview/garden"
        layout="immersive"
      />
    );
  }

  return <GardenPreviewClient />;
}
