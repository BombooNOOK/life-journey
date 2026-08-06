"use client";

import type { ReactNode } from "react";

import { useDonguriWriteEntryGate } from "@/hooks/useDonguriWriteEntryGate";
import { OwlDelayedBusyOverlay } from "@/components/ui/OwlDelayedBusyOverlay";

type Props = {
  href: string;
  dateKey?: string;
  profileId?: string | null;
  checkDraft?: boolean;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
};

export function DonguriWriteEntryLink({
  href,
  dateKey,
  profileId,
  checkDraft,
  className,
  children,
  disabled,
}: Props) {
  const { beginWriteEntry, checking, gateModals } = useDonguriWriteEntryGate(profileId);
  const shouldCheckDraft = checkDraft ?? href.startsWith("/journal");

  return (
    <>
      <a
        href={href}
        className={className}
        aria-disabled={disabled || checking}
        onClick={(e) => {
          e.preventDefault();
          if (disabled || checking) return;
          void beginWriteEntry(href, dateKey, { checkDraft: shouldCheckDraft });
        }}
      >
        {children}
      </a>
      <OwlDelayedBusyOverlay
        busy={checking}
        spinnerDelayMs={0}
        message="あしあとの準備をしています…"
        className="bg-white/20"
      />
      {gateModals}
    </>
  );
}
