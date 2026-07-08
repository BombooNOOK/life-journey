"use client";

import { useEffect, useState } from "react";

import { BrowserBackBlockedHint } from "@/components/ui/BrowserBackBlockedHint";
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
function readFirstVisitFlowBackBlock(kanteiFirstReadGuide: boolean): boolean {
  return (
    kanteiFirstReadGuide ||
    readFirstVisitOrderGuideFlag() ||
    readBookshelfKanteiGuideFlag()
  );
}

export function FirstVisitFlowBrowserBackGuard({ kanteiFirstReadGuide = false }: Props) {
  const [blockBack, setBlockBack] = useState(() =>
    readFirstVisitFlowBackBlock(kanteiFirstReadGuide),
  );

  useEffect(() => {
    setBlockBack(readFirstVisitFlowBackBlock(kanteiFirstReadGuide));
  }, [kanteiFirstReadGuide]);

  const { blockedHintOpen, dismissBlockedHint } = useBlockBrowserBack(blockBack);

  return (
    <BrowserBackBlockedHint open={blockedHintOpen} onDismiss={dismissBlockedHint} />
  );
}
