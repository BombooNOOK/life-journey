"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { markFirstVisitProgressFromPathname } from "@/lib/onboarding/firstVisitWizard/progress";

/** 初回導線の現在位置を sessionStorage に記録（再開用） */
export function FirstVisitProgressMarker() {
  const pathname = usePathname();

  useEffect(() => {
    markFirstVisitProgressFromPathname(pathname);
  }, [pathname]);

  return null;
}
