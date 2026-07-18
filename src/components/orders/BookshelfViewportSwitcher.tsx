"use client";

import type { ReactNode } from "react";

type Props = {
  mobile: ReactNode;
  desktop: ReactNode;
};

/**
 * スマホ＝森の本棚（没入）、PC＝従来のカード一覧。
 * CSS で出し分けて、viewport hook の初期値によるチラつきを避ける。
 */
export function BookshelfViewportSwitcher({ mobile, desktop }: Props) {
  return (
    <>
      <div className="lg:hidden">{mobile}</div>
      <div className="hidden lg:block">{desktop}</div>
    </>
  );
}
