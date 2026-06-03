"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { heroCtaSecondaryClass } from "@/components/home/heroCtaStyles";
import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";

const MY_PAGE_HREF = "/orders";

/** トップページ「マイページへ」：押下直後にフクロウローディングを出して遷移 */
export function HomeMyPageNavButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    router.prefetch(MY_PAGE_HREF);
  }, [router]);

  function handleNavigate() {
    if (busy) return;
    setBusy(true);
    router.push(MY_PAGE_HREF);
  }

  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={handleNavigate}
      className={[
        heroCtaSecondaryClass,
        busy ? "pointer-events-none scale-[0.98] opacity-80" : "active:scale-[0.98] active:opacity-90",
        "transition-[transform,opacity] duration-75",
      ].join(" ")}
    >
      {busy ? (
        <span className="inline-flex items-center justify-center gap-2">
          <OwlSpinIndicator size="sm" />
          <span>マイページを開いています…</span>
        </span>
      ) : (
        "マイページへ"
      )}
    </button>
  );
}
