import Image from "next/image";

import {
  FOREST_BUILDING_SRC,
  type ForestBuildingId,
} from "@/lib/onboarding/firstVisitWizard/forestBuildingAssets";

type Props = {
  building: ForestBuildingId;
  className?: string;
  alt?: string;
};

/** 初回導線：森の建物単独イラスト */
export function ForestBuildingIllustration({
  building,
  className = "",
  alt = "",
}: Props) {
  const src = FOREST_BUILDING_SRC[building];

  return (
    <figure className={className}>
      <div className="mx-auto w-full max-w-xs sm:max-w-sm">
        <Image
          src={src}
          alt={alt}
          width={512}
          height={512}
          sizes="(max-width: 640px) 80vw, 20rem"
          className="h-auto w-full object-contain"
          priority
        />
      </div>
    </figure>
  );
}
