import { notFound } from "next/navigation";

import { Ai7DeviceRecoveryHarnessClient } from "@/components/journal/Ai7DeviceRecoveryHarnessClient";
import { isAi7DeviceRecoveryHarnessPageAllowed } from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/gate";

/**
 * Developer/native-only AI-7 recovery harness.
 * Production NODE_ENV or missing NEXT_PUBLIC_AI7_DEVICE_HARNESS=YES → 404.
 * Not linked from product navigation.
 */
export default function Ai7DeviceRecoveryHarnessPage() {
  if (!isAi7DeviceRecoveryHarnessPageAllowed()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3] px-4 py-8 text-stone-900">
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-xs font-medium tracking-wide text-stone-500">
          Developer tool · AI-7 isolated native recovery
        </p>
        <h1 className="text-xl font-semibold">AI-7 Device Recovery Harness</h1>
        <p className="text-sm leading-relaxed text-stone-600">
          SQLCipher persist / fake lookup / exact replay の確認専用です。Production
          POST はしません。通常のあしあと保存とは別の test actor だけを使います。
        </p>
        <Ai7DeviceRecoveryHarnessClient />
      </div>
    </div>
  );
}
