"use client";

import { SegmentErrorUI } from "@/components/system/SegmentError";

export default function OrderRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentErrorUI error={error} reset={reset} title="新規注文フォームを表示できませんでした" />;
}
