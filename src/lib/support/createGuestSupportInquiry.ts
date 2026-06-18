import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  isGuestSupportInquiryCategory,
  SUPPORT_INQUIRY_MESSAGE_MAX_LENGTH,
  SUPPORT_INQUIRY_MESSAGE_MIN_LENGTH,
  type GuestSupportInquiryCategory,
} from "@/lib/support/supportInquiryTypes";

export type CreateGuestSupportInquiryInput = {
  email: string;
  category: string;
  message: string;
};

export type CreateGuestSupportInquiryResult =
  | { ok: true; inquiryId: string }
  | { ok: false; code: string; error: string };

function isValidEmailShape(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateGuestSupportInquiryInput(input: {
  email: string;
  category: string;
  message: string;
}):
  | { ok: true; email: string; category: GuestSupportInquiryCategory; message: string }
  | { ok: false; code: string; error: string } {
  const email = normalizeEmail(input.email);
  if (!email) {
    return { ok: false, code: "EMPTY_EMAIL", error: "返信用メールアドレスを入力してください。" };
  }
  if (!isValidEmailShape(email)) {
    return { ok: false, code: "INVALID_EMAIL", error: "メールアドレスの形式を確認してください。" };
  }

  if (!isGuestSupportInquiryCategory(input.category)) {
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

  return { ok: true, email, category: input.category, message };
}

export async function createGuestSupportInquiry(
  input: CreateGuestSupportInquiryInput,
): Promise<CreateGuestSupportInquiryResult> {
  const validated = validateGuestSupportInquiryInput(input);
  if (!validated.ok) {
    return validated;
  }

  const row = await prisma.$transaction(async (tx) => {
    const inquiry = await tx.supportInquiry.create({
      data: {
        email: validated.email,
        activeProfileId: null,
        activeProfileName: null,
        category: validated.category,
        message: validated.message,
        status: "pending",
        replyChannel: "email",
      },
      select: { id: true },
    });

    await tx.supportInquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        role: "user",
        body: validated.message,
      },
    });

    return inquiry;
  });

  return { ok: true, inquiryId: row.id };
}
