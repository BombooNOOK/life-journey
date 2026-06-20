import { normalizeEmail } from "@/lib/auth/viewer";
import { isPaidSubscriber } from "@/lib/entitlement/resolveUserEntitlement";
import { deleteJournalEntryPhotoBlobWithResult } from "@/lib/journal/journalEntryPhotoBlob";
import { deleteOrderPdfBlobWithResult } from "@/lib/pdf/orderPdfBlobCache";
import { prisma } from "@/lib/db";
import {
  resolveSubscriptionCancelState,
  type AccountSubscriptionSettings,
} from "@/lib/stripe/subscriptionCancelState";
import { ACCOUNT_DELETE_CONFIRMATION_WORD } from "@/lib/account/accountDeleteTypes";

export class AccountDeleteError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "AccountDeleteError";
  }
}

export type AccountDeletePreview = {
  email: string;
  canDelete: boolean;
  blockCode: string | null;
  blockMessage: string | null;
  profileCount: number;
  journalEntryCount: number;
  orderCount: number;
};

export type AccountDeleteResult = {
  email: string;
  deletedProfileCount: number;
  deletedJournalEntryCount: number;
  deletedOrderCount: number;
  deletedDiaryBookCount: number;
  deletedBookshelfBookCount: number;
  deletedDiaryBindingCount: number;
  deletedKanteiBindingCount: number;
  deletedSupportInquiryCount: number;
  deletedPhotoBlobCount: number;
  failedPhotoBlobCount: number;
  deletedKanteiPdfBlobCount: number;
  failedKanteiPdfBlobCount: number;
};

function parseConfirmationWord(raw: unknown): void {
  const word = typeof raw === "string" ? raw.trim() : "";
  if (word !== ACCOUNT_DELETE_CONFIRMATION_WORD) {
    throw new AccountDeleteError(
      `確認のため「${ACCOUNT_DELETE_CONFIRMATION_WORD}」と入力してください。`,
      "CONFIRMATION_WORD_MISMATCH",
    );
  }
}

export async function buildAccountDeletePreview(emailInput: string): Promise<AccountDeletePreview> {
  const email = normalizeEmail(emailInput);
  if (!email) {
    throw new AccountDeleteError("メールアドレスを確認できませんでした。", "EMAIL_MISSING");
  }

  const settings = await prisma.accountSettings.findUnique({
    where: { email },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      isAdmin: true,
    },
  });

  if (settings?.isAdmin === true) {
    return {
      email,
      canDelete: false,
      blockCode: "ADMIN_ACCOUNT",
      blockMessage: "管理者アカウントはここから削除できません。",
      profileCount: 0,
      journalEntryCount: 0,
      orderCount: 0,
    };
  }

  const cancelState = await resolveSubscriptionCancelState(settings);
  if (cancelState.isPaidPlan && !cancelState.cancelAtPeriodEnd) {
    return {
      email,
      canDelete: false,
      blockCode: "PAID_PLAN_ACTIVE",
      blockMessage: "有料プランをご利用中の場合は、先に有料プランの解約が必要です。",
      profileCount: 0,
      journalEntryCount: 0,
      orderCount: 0,
    };
  }

  const [profileCount, journalEntryCount, orderCount] = await Promise.all([
    prisma.profile.count({ where: { email } }),
    prisma.journalEntry.count({ where: { email } }),
    prisma.order.count({ where: { email } }),
  ]);

  return {
    email,
    canDelete: true,
    blockCode: null,
    blockMessage: null,
    profileCount,
    journalEntryCount,
    orderCount,
  };
}

export async function deleteUserAccount(params: {
  emailInput: string;
  confirmationWord?: unknown;
}): Promise<AccountDeleteResult> {
  const preview = await buildAccountDeletePreview(params.emailInput);
  if (!preview.canDelete) {
    throw new AccountDeleteError(
      preview.blockMessage ?? "アカウントを削除できません。",
      preview.blockCode ?? "DELETE_BLOCKED",
    );
  }

  parseConfirmationWord(params.confirmationWord);

  const email = preview.email;
  const scope = { email };

  const [entries, orders] = await Promise.all([
    prisma.journalEntry.findMany({
      where: scope,
      select: { photoBlobPathname: true, photoBlobUrl: true },
    }),
    prisma.order.findMany({
      where: scope,
      select: { pdfPreviewBlobUrl: true, pdfPrintBlobUrl: true },
    }),
  ]);

  const deleted = await prisma.$transaction(async (tx) => {
    const deletedDiaryBindings = await tx.diaryBookBindingRequest.deleteMany({ where: scope });
    const deletedKanteiBindings = await tx.kanteiBookBindingRequest.deleteMany({ where: scope });
    const deletedOrders = await tx.order.deleteMany({ where: scope });
    const deletedDiaryBooks = await tx.diaryBook.deleteMany({ where: scope });
    const deletedBookshelfBooks = await tx.diaryBookshelfBook.deleteMany({ where: scope });
    const deletedJournalEntries = await tx.journalEntry.deleteMany({ where: scope });
    const deletedProfiles = await tx.profile.deleteMany({ where: scope });
    const deletedSupportInquiries = await tx.supportInquiry.deleteMany({ where: scope });
    await tx.accountSettings.deleteMany({ where: scope });

    return {
      deletedDiaryBindings: deletedDiaryBindings.count,
      deletedKanteiBindings: deletedKanteiBindings.count,
      deletedOrders: deletedOrders.count,
      deletedDiaryBooks: deletedDiaryBooks.count,
      deletedBookshelfBooks: deletedBookshelfBooks.count,
      deletedJournalEntries: deletedJournalEntries.count,
      deletedProfiles: deletedProfiles.count,
      deletedSupportInquiries: deletedSupportInquiries.count,
    };
  });

  let deletedPhotoBlobCount = 0;
  let failedPhotoBlobCount = 0;

  for (const entry of entries) {
    const pathname = entry.photoBlobPathname?.trim();
    const blobUrl = entry.photoBlobUrl?.trim();
    if (!pathname && !blobUrl) continue;

    const result = await deleteJournalEntryPhotoBlobWithResult(pathname, blobUrl);
    if (result.ok) {
      deletedPhotoBlobCount += 1;
    } else {
      failedPhotoBlobCount += 1;
    }
  }

  let deletedKanteiPdfBlobCount = 0;
  let failedKanteiPdfBlobCount = 0;

  for (const row of orders) {
    for (const blobUrl of [row.pdfPreviewBlobUrl, row.pdfPrintBlobUrl]) {
      if (!blobUrl?.trim()) continue;
      const result = await deleteOrderPdfBlobWithResult(blobUrl);
      if (result.ok) {
        deletedKanteiPdfBlobCount += 1;
      } else {
        failedKanteiPdfBlobCount += 1;
      }
    }
  }

  console.info("[account-delete] ok", {
    email,
    deletedProfileCount: deleted.deletedProfiles,
    deletedJournalEntryCount: deleted.deletedJournalEntries,
    deletedOrderCount: deleted.deletedOrders,
  });

  return {
    email,
    deletedProfileCount: deleted.deletedProfiles,
    deletedJournalEntryCount: deleted.deletedJournalEntries,
    deletedOrderCount: deleted.deletedOrders,
    deletedDiaryBookCount: deleted.deletedDiaryBooks,
    deletedBookshelfBookCount: deleted.deletedBookshelfBooks,
    deletedDiaryBindingCount: deleted.deletedDiaryBindings,
    deletedKanteiBindingCount: deleted.deletedKanteiBindings,
    deletedSupportInquiryCount: deleted.deletedSupportInquiries,
    deletedPhotoBlobCount,
    failedPhotoBlobCount,
    deletedKanteiPdfBlobCount,
    failedKanteiPdfBlobCount,
  };
}

export function accountDeleteBlockMessageForSettings(
  settings: AccountSubscriptionSettings | null | undefined,
  cancelAtPeriodEnd: boolean,
): string | null {
  if (isPaidSubscriber(settings ?? null) && !cancelAtPeriodEnd) {
    return "有料プランをご利用中の場合は、先に有料プランの解約が必要です。";
  }
  return null;
}
