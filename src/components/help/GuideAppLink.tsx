"use client";

import type { ReactNode } from "react";

import { AppTransitionLink } from "@/components/ui/AppTransitionLink";

export function GuideAppLink({ href, label }: { href: string; label: ReactNode }) {
  return (
    <p className="mt-3">
      <AppTransitionLink
        href={href}
        className="font-medium text-emerald-900 underline-offset-2 hover:underline active:opacity-70"
      >
        {label} →
      </AppTransitionLink>
    </p>
  );
}
