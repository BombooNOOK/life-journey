import type { SupportInquiryMessage } from "@prisma/client";

import type { SerializedSupportInquiryMessage } from "@/lib/support/supportInquiryMessageTypes";
import type { SupportInquiryMessageRole } from "@/lib/support/supportInquiryMessageTypes";

export function serializeSupportInquiryMessage(
  message: Pick<SupportInquiryMessage, "id" | "createdAt" | "role" | "body" | "authorEmail">,
): SerializedSupportInquiryMessage {
  return {
    id: message.id,
    createdAt: message.createdAt.toISOString(),
    role: message.role as SupportInquiryMessageRole,
    body: message.body,
    authorEmail: message.authorEmail?.trim() || null,
  };
}
