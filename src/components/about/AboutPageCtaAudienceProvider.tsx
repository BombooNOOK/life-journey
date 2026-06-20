"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useAboutPageCtaAudience } from "@/hooks/useAboutPageCtaAudience";

type AboutCtaAudienceContextValue = ReturnType<typeof useAboutPageCtaAudience>;

const AboutPageCtaAudienceContext = createContext<AboutCtaAudienceContextValue | null>(null);

export function AboutPageCtaAudienceProvider({ children }: { children: ReactNode }) {
  const value = useAboutPageCtaAudience();
  return (
    <AboutPageCtaAudienceContext.Provider value={value}>{children}</AboutPageCtaAudienceContext.Provider>
  );
}

export function useAboutPageCtaAudienceContext(): AboutCtaAudienceContextValue {
  const value = useContext(AboutPageCtaAudienceContext);
  if (!value) {
    throw new Error("useAboutPageCtaAudienceContext must be used within AboutPageCtaAudienceProvider");
  }
  return value;
}
