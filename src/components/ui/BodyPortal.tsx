"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** SiteHeader (50) とモバイル nav (210) より前面の没入 UI 用 */
export const IMMERSIVE_OVERLAY_Z_CLASS = "z-[220]" as const;

type Props = {
  children: ReactNode;
};

/** main の stacking context を抜けて document.body 直下に描画する */
export function BodyPortal({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
