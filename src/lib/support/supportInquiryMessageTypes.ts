export const SUPPORT_INQUIRY_MESSAGE_ROLES = ["user", "admin"] as const;

export type SupportInquiryMessageRole = (typeof SUPPORT_INQUIRY_MESSAGE_ROLES)[number];

export function isSupportInquiryMessageRole(value: string): value is SupportInquiryMessageRole {
  return (SUPPORT_INQUIRY_MESSAGE_ROLES as readonly string[]).includes(value);
}

export type SerializedSupportInquiryMessage = {
  id: string;
  createdAt: string;
  role: SupportInquiryMessageRole;
  body: string;
  authorEmail: string | null;
};
