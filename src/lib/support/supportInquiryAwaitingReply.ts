import type { SupportInquiryMessageRole } from "@/lib/support/supportInquiryMessageTypes";
import type { SupportInquiryStatus } from "@/lib/support/supportInquiryTypes";

export function isSupportInquiryAwaitingAdminReply(input: {
  status: SupportInquiryStatus | string;
  lastMessageRole: SupportInquiryMessageRole | string | null | undefined;
}): boolean {
  if (input.status === "closed") return false;
  return input.lastMessageRole === "user";
}

export function compareSupportInquiriesForAdminList(
  a: { updatedAt: Date; awaitingAdminReply: boolean },
  b: { updatedAt: Date; awaitingAdminReply: boolean },
): number {
  if (a.awaitingAdminReply !== b.awaitingAdminReply) {
    return a.awaitingAdminReply ? -1 : 1;
  }
  return b.updatedAt.getTime() - a.updatedAt.getTime();
}
