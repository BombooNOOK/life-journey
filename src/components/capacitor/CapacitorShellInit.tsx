"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { StatusBar, Style } from "@capacitor/status-bar";

/** Capacitor ネイティブシェル向けの最小初期化（v0.1: UI 検証用） */
export function CapacitorShellInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
      } catch {
        /* Web や未対応環境 */
      }

      if (Capacitor.getPlatform() === "ios") {
        try {
          await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        } catch {
          /* optional */
        }
      }
    })();

    const sub = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      }
    });

    return () => {
      void sub.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
