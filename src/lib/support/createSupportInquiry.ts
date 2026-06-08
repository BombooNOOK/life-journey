import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  isSupportInquiryCategory,
  SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH,
  SUPPORT_INQUIRY_MESSAGE_MIN_LENGTH,
  type SupportInquiryCategory,
} from "@/lib/support/supportInquiryTypes";

export type CreateSupportInquiryInput = {
  viewerEmail: string;
  activeProfileId: string | null;
  activeProfileName: string | null;
  category: string;
  message: string;
};

export type CreateSupportInquiryResult =
  | { ok: true; inquiryId: string }
  | { ok: false; code: string; error: string };

export function validateSupportInquiryInput(input: {
  category: string;
  message: string;
}): { ok: true; category: SupportInquiryCategory; message: string } | { ok: false; code: string; error: string } {
  if (!isSupportInquiryCategory(input.category)) {
    return { ok: false, code: "INVALID_CATEGORY", error: "お問い合わせ種別を選択してください。" };
  }
  const message = input.message.trim();
  if (message.length < SUPPORT_INQUIRY_MESSAGE_MIN_LENGTH) {
    return { ok: false, code: "EMPTY_MESSAGE", error: "内容を入力してください。" };
  }
  if (message.length > SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      code: "MESSAGE_TOO_LONG",
      error: `内容は${SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH}文字以内で入力してください。`,
    };
  }
  return { ok: true, category: input.category, message };
}

export async function createSupportInquiry(
  input: CreateSupportInquiryInput,
): Promise<CreateSupportInquiryResult> {
  const email = normalizeEmail(input.viewerEmail);
  if (!email) {
    return { ok: false, code: "AUTH_REQUIRED", error: "ログインが必要です。" };
  }

  const validated = validateSupportInquiryInput({
    category: input.category,
    message: input.message,
  });
  if (!validated.ok) {
    return validated;
  }

  const row = await prisma.supportInquiry.create({
    data: {
      email,
      activeProfileId: input.activeProfileId?.trim() || null,
      activeProfileName: input.activeProfileName?.trim() || null,
      category: validated.category,
      message: validated.message,
      status: "pending",
    },
    select: { id: true },
  });

  return { ok: true, inquiryId: row.id };
}
