import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { sendSupportInquiryReplyEmail } from "@/lib/support/sendSupportInquiryReplyEmail";
import {
  SUPPORT_INQUIRY_CATEGORY_LABELS,
  type SupportInquiryCategory,
  type SupportInquiryStatus,
} from "@/lib/support/supportInquiryTypes";
import {
  isSupportInquiryMessageRole,
  type SupportInquiryMessageRole,
} from "@/lib/support/supportInquiryMessageTypes";
import { validateSupportInquiryMessageBody } from "@/lib/support/validateSupportInquiryMessageBody";

export type AddSupportInquiryMessageInput = {
  inquiryId: string;
  role: SupportInquiryMessageRole;
  message: string;
  authorEmail?: string | null;
  threadUrl?: string;
};

export type AddSupportInquiryMessageResult =
  | { ok: true; messageId: string; emailSent?: boolean }
  | { ok: false; code: string; error: string };

function nextStatusAfterUserReply(currentStatus: SupportInquiryStatus): SupportInquiryStatus {
  if (currentStatus === "resolved" || currentStatus === "closed") {
    return "pending";
  }
  return currentStatus;
}

function nextStatusAfterAdminReply(currentStatus: SupportInquiryStatus): SupportInquiryStatus {
  if (currentStatus === "pending") {
    return "in_progress";
  }
  return currentStatus;
}

export async function addSupportInquiryMessage(
  input: AddSupportInquiryMessageInput,
): Promise<AddSupportInquiryMessageResult> {
  if (!isSupportInquiryMessageRole(input.role)) {
    return { ok: false, code: "INVALID_ROLE", error: "送信者が不正です。" };
  }

  const validated = validateSupportInquiryMessageBody(input.message);
  if (!validated.ok) {
    return validated;
  }

  const authorEmail =
    input.role === "admin" && input.authorEmail?.trim()
      ? normalizeEmail(input.authorEmail)
      : null;

  const inquiry = await prisma.supportInquiry.findUnique({
    where: { id: input.inquiryId },
    select: {
      id: true,
      email: true,
      category: true,
      status: true,
    },
  });

  if (!inquiry) {
    return { ok: false, code: "NOT_FOUND", error: "お問い合わせが見つかりません。" };
  }

  const currentStatus = inquiry.status as SupportInquiryStatus;
  const nextStatus =
    input.role === "admin"
      ? nextStatusAfterAdminReply(currentStatus)
      : nextStatusAfterUserReply(currentStatus);

  const created = await prisma.$transaction(async (tx) => {
    const message = await tx.supportInquiryMessage.create({
      data: {
        inquiryId: inquiry.id,
        role: input.role,
        body: validated.body,
        authorEmail,
      },
      select: { id: true },
    });

    await tx.supportInquiry.update({
      where: { id: inquiry.id },
      data: { status: nextStatus },
    });

    return message;
  });

  let emailSent: boolean | undefined;
  if (input.role === "admin") {
    const category = inquiry.category as SupportInquiryCategory;
    const categoryLabel = SUPPORT_INQUIRY_CATEGORY_LABELS[category] ?? inquiry.category;
    const threadUrl =
      input.threadUrl?.trim() ||
      `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://life-journey-zeta.vercel.app"}/orders/support/${encodeURIComponent(inquiry.id)}`;

    const emailResult = await sendSupportInquiryReplyEmail({
      toEmail: inquiry.email,
      categoryLabel,
      replyBody: validated.body,
      threadUrl,
    });
    emailSent = emailResult.sent;
  }

  return { ok: true, messageId: created.id, emailSent };
}
