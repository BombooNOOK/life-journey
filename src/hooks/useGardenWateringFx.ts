"use client";

import { useCallback, useState } from "react";

type Options = {
  /** true のときだけ演出を挟む（水やり可能なとき） */
  canAnimate: boolean;
  water: () => Promise<void>;
};

/** ジョウロ／ボタンタップ：可能なら演出を出しつつ水やり API を走らせる */
export function useGardenWateringFx({ canAnimate, water }: Options) {
  const [active, setActive] = useState(false);

  const requestWater = useCallback(() => {
    if (!canAnimate) {
      void water();
      return;
    }
    setActive(true);
    void water();
  }, [canAnimate, water]);

  const completeFx = useCallback(() => {
    setActive(false);
  }, []);

  return {
    wateringFxActive: active,
    requestWater,
    completeFx,
  };
}
