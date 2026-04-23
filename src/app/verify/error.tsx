"use client";

import { SegmentErrorUI } from "@/components/system/SegmentError";

export default function VerifyRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentErrorUI error={error} reset={reset} title="数秘検証画面を表示できませんでした" />;
}
