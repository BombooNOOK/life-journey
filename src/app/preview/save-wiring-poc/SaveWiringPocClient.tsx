"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";

import { runInternalSaveMirrorWiringPoc } from "@/lib/local-first/journal/save/runInternalSaveMirrorWiringPoc";

/**
 * Developer-only: auto-run 4B-4L L1–L13 against the entry id captured from
 * this device's latest internal save (save-wiring-test-entry-id.txt).
 * Not a product surface.
 */
export default function SaveWiringPocClient() {
  const [text, setText] = useState("running…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;
    void (async () => {
      try {
        if (!Capacitor.isNativePlatform()) {
          setText("native Simulator only");
          return;
        }
        const report = await runInternalSaveMirrorWiringPoc();
        if (!cancelled) setText(JSON.stringify(report, null, 2));
      } catch (error) {
        if (!cancelled) {
          setText(error instanceof Error ? error.message : String(error));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <pre className="whitespace-pre-wrap break-all p-4 text-xs text-stone-800">{text}</pre>
  );
}
