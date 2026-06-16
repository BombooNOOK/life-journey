import {
  SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH,
  SUPPORT_INQUIRY_MESSAGE_MIN_LENGTH,
} from "@/lib/support/supportInquiryTypes";

export function validateSupportInquiryMessageBody(
  message: string,
): { ok: true; body: string } | { ok: false; code: string; error: string } {
  const body = message.trim();
  if (body.length < SUPPORT_INQUIRY_MESSAGE_MIN_LENGTH) {
    return { ok: false, code: "EMPTY_MESSAGE", error: "内容を入力してください。" };
  }
  if (body.length > SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      code: "MESSAGE_TOO_LONG",
      error: `内容は${SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH}文字以内で入力してください。`,
    };
  }
  return { ok: true, body };
}
