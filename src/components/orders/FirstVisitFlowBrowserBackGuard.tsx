"use client";

import { useEffect, useState } from "react";

import { useBlockBrowserBack } from "@/hooks/useBlockBrowserBack";
import {
  readBookshelfKanteiGuideFlag,
  readFirstVisitOrderGuideFlag,
} from "@/lib/onboarding/firstVisitWizard/session";

type Props = {
  /** 鑑定書初回読書ガイド中 */
  kanteiFirstReadGuide?: boolean;
};

/** 初回導線の延長（/order・本棚・鑑定書プレビュー）でスワイプ戻りを無効化 */
export function FirstVisitFlowBrowserBackGuard({ kanteiFirstReadGuide = false }: Props) {
  const [blockBack, setBlockBack] = useState(false);

  useEffect(() => {
    setBlockBack(
      kanteiFirstReadGuide ||
        readFirstVisitOrderGuideFlag() ||
        readBookshelfKanteiGuideFlag(),
    );
  }, [kanteiFirstReadGuide]);

  useBlockBrowserBack(blockBack);
  return null;
}
