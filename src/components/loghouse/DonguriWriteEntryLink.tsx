"use client";

import type { ReactNode } from "react";

import { useDonguriWriteEntryGate } from "@/hooks/useDonguriWriteEntryGate";

type Props = {
  href: string;
  dateKey?: string;
  profileId?: string | null;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
};

export function DonguriWriteEntryLink({
  href,
  dateKey,
  profileId,
  className,
  children,
  disabled,
}: Props) {
  const { beginWriteEntry, checking, gateModals } = useDonguriWriteEntryGate(profileId);

  return (
    <>
      <a
        href={href}
        className={className}
        aria-disabled={disabled || checking}
        onClick={(e) => {
          e.preventDefault();
          if (disabled || checking) return;
          void beginWriteEntry(href, dateKey);
        }}
      >
        {children}
      </a>
      {gateModals}
    </>
  );
}
