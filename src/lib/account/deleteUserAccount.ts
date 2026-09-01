import { normalizeEmail } from "@/lib/auth/viewer";
import {
  deleteFirebaseAuthUserByEmail,
  isFirebaseAdminConfigured,
} from "@/lib/firebase/admin";
import { deleteJournalEntryPhotoBlobWithResult } from "@/lib/journal/journalEntryPhotoBlob";
import { deleteOrderPdfBlobWithResult } from "@/lib/pdf/orderPdfBlobCache";
import { prisma } from "@/lib/db";
import { withPrismaConnectionRetry } from "@/lib/db/prismaRetry";
import {
  hasActiveCancellableSubscription,
  resolveSubscriptionCancelState,
  type AccountSubscriptionSettings,
} from "@/lib/stripe/subscriptionCancelState";
import { ACCOUNT_DELETE_CONFIRMATION_WORD } from "@/lib/account/accountDeleteTypes";

/** Neon 上で複数テーブル削除が長引くことがあるため余裕を持たせる */
const ACCOUNT_DELETE_TX_TIMEOUT_MS = 45_000;
const ACCOUNT_DELETE_TX_MAX_WAIT_MS = 10_000;

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
  firebaseAuthDeleted: boolean;
};

const FIREBASE_ADMIN_NOT_CONFIGURED_MESSAGE =
  "現在、アカウントの削除を完了できません。しばらくしてから再度お試しいただくか、お問い合わせください。";

function assertFirebaseAdminReadyForAccountDelete(): void {
  if (process.env.NODE_ENV === "production" && !isFirebaseAdminConfigured()) {
    throw new AccountDeleteError(
      FIREBASE_ADMIN_NOT_CONFIGURED_MESSAGE,
      "FIREBASE_ADMIN_NOT_CONFIGURED",
    );
  }
}

function parseConfirmationWord(raw: unknown): void {
  const word = typeof raw === "string" ? raw.trim() : "";
  if (word !== ACCOUNT_DELETE_CONFIRMATION_WORD) {
    throw new AccountDeleteError(
      `確認のため「${ACCOUNT_DELETE_CONFIRMATION_WORD}」と入力してください。`,
      "CONFIRMATION_WORD_MISMATCH",
    );
  }
}

async function deleteFirebaseAuthWithRetry(email: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await deleteFirebaseAuthUserByEmail(email);
      return;
    } catch (error) {
      lastError = error;
      console.warn("[account-delete] firebase auth delete attempt failed", {
        email,
        attempt,
        error,
      });
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  }
  throw lastError;
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

  if (process.env.NODE_ENV === "production" && !isFirebaseAdminConfigured()) {
    return {
      email,
      canDelete: false,
      blockCode: "FIREBASE_ADMIN_NOT_CONFIGURED",
      blockMessage: FIREBASE_ADMIN_NOT_CONFIGURED_MESSAGE,
      profileCount: 0,
      journalEntryCount: 0,
      orderCount: 0,
    };
  }

  if (hasActiveCancellableSubscription(settings)) {
    const cancelState = await resolveSubscriptionCancelState(settings);
    if (!cancelState.cancelAtPeriodEnd) {
      return {
        email,
        canDelete: false,
        blockCode: "PAID_PLAN_ACTIVE",
        blockMessage: "森の定期便をご利用中の場合は、先に解約が必要です。",
        profileCount: 0,
        journalEntryCount: 0,
        orderCount: 0,
      };
    }
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
  assertFirebaseAdminReadyForAccountDelete();

  const email = preview.email;
  const scope = { email };

  /**
   * 重要: アプリDBを先に消してから Firebase Auth を消す。
   * Auth を先に消すと、DB失敗時にログインだけ消えてセッションが切れ、
   * 再試行できずループしたように見える（本番で発生）。
   * Auth だけ残っても、もう一度削除すれば掃除できる。
   */
  const [entries, orders] = await Promise.all([
    withPrismaConnectionRetry(() =>
      prisma.journalEntry.findMany({
        where: scope,
        select: { photoBlobPathname: true, photoBlobUrl: true },
      }),
    ),
    withPrismaConnectionRetry(() =>
      prisma.order.findMany({
        where: scope,
        select: { pdfPreviewBlobUrl: true, pdfPrintBlobUrl: true },
      }),
    ),
  ]);

  let deleted: {
    deletedDiaryBindings: number;
    deletedKanteiBindings: number;
    deletedOrders: number;
    deletedDiaryBooks: number;
    deletedBookshelfBooks: number;
    deletedJournalEntries: number;
    deletedJournalDrafts: number;
    deletedJournalSaveOperations: number;
    deletedGardenDisplayFlowers: number;
    deletedMailboxNotices: number;
    deletedDonguriLedger: number;
    deletedSystemNoticeReads: number;
    deletedGardenPlants: number;
    deletedProfiles: number;
    deletedSupportInquiries: number;
  };

  try {
    deleted = await withPrismaConnectionRetry(() =>
      prisma.$transaction(
        async (tx) => {
          const deletedDiaryBindings = await tx.diaryBookBindingRequest.deleteMany({ where: scope });
          const deletedKanteiBindings = await tx.kanteiBookBindingRequest.deleteMany({
            where: scope,
          });
          const deletedOrders = await tx.order.deleteMany({ where: scope });
          const deletedDiaryBooks = await tx.diaryBook.deleteMany({ where: scope });
          const deletedBookshelfBooks = await tx.diaryBookshelfBook.deleteMany({ where: scope });
          const deletedJournalEntries = await tx.journalEntry.deleteMany({ where: scope });
          const deletedJournalDrafts = await tx.journalDraft.deleteMany({ where: scope });
          // 4B-4AI-1: rollout cohort is actorKey=email today; keep delete atomic
          // so a deleted account cannot retain a future protocol admission row.
          await tx.journalSaveIdempotencyRollout.deleteMany({
            where: { actorKey: email },
          });
          // 4B-4Y: actorKey SoT = normalizeEmail(viewerEmail); delete with account PII cleanup.
          const deletedJournalSaveOperations = await tx.journalSaveOperation.deleteMany({
            where: { actorKey: email },
          });
          const deletedGardenDisplayFlowers = await tx.gardenDisplayFlower.deleteMany({
            where: scope,
          });
          const deletedMailboxNotices = await tx.logHouseMailboxNotice.deleteMany({ where: scope });
          const deletedDonguriLedger = await tx.logHouseDonguriLedgerEntry.deleteMany({
            where: scope,
          });
          const deletedSystemNoticeReads = await tx.systemNoticeReadState.deleteMany({
            where: scope,
          });
          const deletedGardenPlants = await tx.gardenPlant.deleteMany({ where: scope });
          const deletedProfiles = await tx.profile.deleteMany({ where: scope });
          const deletedSupportInquiries = await tx.supportInquiry.deleteMany({ where: scope });
          // AccountSettings must be purged before AccountIdentity (FK Restrict on
          // identityId — AI-X6.5A). Identity/claim cleanup remains a later gate.
          await tx.accountSettings.deleteMany({ where: scope });

          return {
            deletedDiaryBindings: deletedDiaryBindings.count,
            deletedKanteiBindings: deletedKanteiBindings.count,
            deletedOrders: deletedOrders.count,
            deletedDiaryBooks: deletedDiaryBooks.count,
            deletedBookshelfBooks: deletedBookshelfBooks.count,
            deletedJournalEntries: deletedJournalEntries.count,
            deletedJournalDrafts: deletedJournalDrafts.count,
            deletedJournalSaveOperations: deletedJournalSaveOperations.count,
            deletedGardenDisplayFlowers: deletedGardenDisplayFlowers.count,
            deletedMailboxNotices: deletedMailboxNotices.count,
            deletedDonguriLedger: deletedDonguriLedger.count,
            deletedSystemNoticeReads: deletedSystemNoticeReads.count,
            deletedGardenPlants: deletedGardenPlants.count,
            deletedProfiles: deletedProfiles.count,
            deletedSupportInquiries: deletedSupportInquiries.count,
          };
        },
        {
          maxWait: ACCOUNT_DELETE_TX_MAX_WAIT_MS,
          timeout: ACCOUNT_DELETE_TX_TIMEOUT_MS,
        },
      ),
    );
  } catch (error) {
    console.error("[account-delete] db cleanup failed", { email, error });
    throw new AccountDeleteError(
      "データの削除に失敗しました。時間をおいて再度お試しください。",
      "DB_DELETE_FAILED",
    );
  }

  let firebaseAuthDeleted = false;
  if (isFirebaseAdminConfigured()) {
    try {
      await deleteFirebaseAuthWithRetry(email);
      firebaseAuthDeleted = true;
    } catch (error) {
      // DB は消えているので、ここでの失敗は「完了扱い」。ログインが残っても再削除で掃除できる。
      console.error("[account-delete] firebase auth delete failed after db cleanup", {
        email,
        error,
      });
    }
  } else {
    console.warn(
      "[account-delete] skipping firebase auth delete (FIREBASE_SERVICE_ACCOUNT_JSON unset)",
    );
  }

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
    firebaseAuthDeleted,
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
    firebaseAuthDeleted,
  };
}

export function accountDeleteBlockMessageForSettings(
  settings: AccountSubscriptionSettings | null | undefined,
  cancelAtPeriodEnd: boolean,
): string | null {
  if (hasActiveCancellableSubscription(settings) && !cancelAtPeriodEnd) {
    return "森の定期便をご利用中の場合は、先に解約が必要です。";
  }
  return null;
}
