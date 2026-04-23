"use client";

import { SegmentErrorUI } from "@/components/system/SegmentError";

export default function OrderDetailRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentErrorUI error={error} reset={reset} title="注文詳細を表示できませんでした" />;
}
