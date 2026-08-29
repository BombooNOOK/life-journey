import { notFound } from "next/navigation";

import { X66bDeviceValidationClient } from "@/components/journal/X66bDeviceValidationClient";
import { isX66bDeviceValidationPageAllowed } from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/gate";

/**
 * Dev-only X6.6B company-SE3 autorun validation entry.
 * Production NODE_ENV or missing NEXT_PUBLIC_LJD_X6_DEVICE_VALIDATION_AUTORUN=YES → 404.
 * Not linked from product navigation.
 */
export default function X66bDeviceValidationPage() {
  if (!isX66bDeviceValidationPageAllowed()) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#f4f6f3] px-4 py-8 text-stone-900">
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-xs font-medium tracking-wide text-stone-500">
          Developer tool · X6.6B native stable pending-intent validation
        </p>
        <h1 className="text-xl font-semibold">X6.6B Device Validation Autorun</h1>
        <p className="text-sm leading-relaxed text-stone-600">
          Calls the real journal save/recovery orchestrator with the current Firebase
          session. Controlled interrupt leaves a durable pending intent for restart
          recovery. Not available in Production.
        </p>
        <X66bDeviceValidationClient />
      </div>
    </div>
  );
}
