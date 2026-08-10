"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Phase 4B-1 Capacitor native shell init (iOS verification).
 * No Local DB / Filesystem. Does not change Web-only behavior on browser.
 *
 * Rebuild notes (not cherry-picked from old hybrid branch):
 * - StatusBar Light suits LJD's bright forest UI
 * - Keyboard resize Body on iOS so inputs are not covered
 * - Android backButton is registered only on Android (iOS uses system gestures/nav)
 */
export function CapacitorShellInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
      } catch {
        /* Web or plugin unavailable */
      }

      if (Capacitor.getPlatform() === "ios") {
        try {
          await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        } catch {
          /* optional */
        }
      }
    })();

    if (Capacitor.getPlatform() !== "android") {
      return;
    }

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
