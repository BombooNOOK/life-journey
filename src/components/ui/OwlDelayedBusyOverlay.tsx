"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useDelayedBusy } from "@/hooks/useDelayedBusy";
import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";
import {
  DELAYED_BUSY_MESSAGE_MS,
  DELAYED_BUSY_SPINNER_MS,
} from "@/lib/ui/delayedBusyConstants";

type Props = {
  busy: boolean;
  /** 長めに待つときだけ出す文言（任意） */
  message?: string;
  spinnerDelayMs?: number;
  messageDelayMs?: number;
  className?: string;
};

/** 待ちが続いたときだけフクロウを出す軽量オーバーレイ */
export function OwlDelayedBusyOverlay({
  busy,
  message,
  spinnerDelayMs = DELAYED_BUSY_SPINNER_MS,
  messageDelayMs = DELAYED_BUSY_MESSAGE_MS,
  className = "",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const showSpinner = useDelayedBusy(busy, spinnerDelayMs);
  const showMessage = useDelayedBusy(busy, messageDelayMs);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !showSpinner) {
    return null;
  }

  return createPortal(
    <div
      className={[
        "pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-black/[0.04]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message && showMessage ? message : "読み込み中"}
    >
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-stone-200/80 bg-[#fffdf9]/95 px-5 py-4 shadow-lg">
        <OwlSpinIndicator size="md" />
        {message && showMessage ? (
          <p className="max-w-[16rem] text-center text-sm leading-relaxed text-stone-600">{message}</p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
