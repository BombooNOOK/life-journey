"use client";

import { useEffect, useState } from "react";

import { runLocalSaveOperationIntentPoc } from "@/lib/local-first/journal/saveIntent/runLocalSaveOperationIntentPoc";

/**
 * Developer-only 4B-4O I1–I9 runner. Auto-starts once on native WebView.
 */
export default function SaveIntentPocClient() {
  const [text, setText] = useState("starting…");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const report = await runLocalSaveOperationIntentPoc();
        if (cancelled) return;
        const fails = report.steps.filter((s) => s.status === "fail").length;
        setText(
          JSON.stringify(
            {
              fails,
              ...report,
            },
            null,
            2,
          ),
        );
      } catch (e) {
        if (cancelled) return;
        setText(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <pre className="overflow-auto rounded border border-stone-300 bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap">
      {text}
    </pre>
  );
}
