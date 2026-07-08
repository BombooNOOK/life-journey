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

/** 待ちが続いたときだけフクロウを出す軽量オーバーレイ（背景透明） */
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
        "pointer-events-none fixed inset-0 z-[200] flex items-center justify-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message && showMessage ? message : "読み込み中"}
    >
      <div className="flex flex-col items-center gap-2">
        <OwlSpinIndicator size="md" />
        {message && showMessage ? (
          <p className="max-w-[16rem] text-center text-sm leading-relaxed text-stone-700 [text-shadow:0_0_8px_rgba(255,253,249,0.95),0_1px_2px_rgba(255,255,255,0.9)]">
            {message}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
