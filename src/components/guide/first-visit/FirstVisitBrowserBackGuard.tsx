"use client";

import type { ReactNode } from "react";

import { useBlockBrowserBack } from "@/hooks/useBlockBrowserBack";

type Props = {
  children: ReactNode;
};

/** はじめての方導線（/guide/first/*）：ブラウザのスワイプ戻りを無効化 */
export function FirstVisitBrowserBackGuard({ children }: Props) {
  useBlockBrowserBack(true);
  return children;
}
