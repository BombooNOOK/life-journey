/**
 * Map executeJournalSaveOperation outcomes to HTTP for Production POST (4B-4Y).
 */

import { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { guardianColorNameForEntryDate } from "@/lib/journal/guardianColorForEntryDate";
import { formatJournalEntryForApiResponse } from "@/lib/journal/journalEntryApiSerialize";
import {
  profileHasKanteiOrder,
} from "@/lib/journal/kanteiCommentEligibility";
import { journalEntryDateToIsoDateInput } from "@/lib/journal/referenceDateParts";
import {
  executeJournalSaveOperation,
} from "@/lib/journal/saveIdempotency/executeJournalSaveOperation";
import { createPrismaJournalSaveOperationStore } from "@/lib/journal/saveIdempotency/prismaJournalSaveOperationStore";
import {
  createProductionJournalSavePorts,
  entrySelect,
  type ProductionJournalSavePortContext,
} from "@/lib/journal/saveIdempotency/productionJournalSavePorts";
import { sumDonguriBalance } from "@/lib/loghouse/donguriLedger";
import { findKanteiOrderForProfile } from "@/lib/profile/orderPerProfile";
import type { ExecuteJournalSaveOperationOutcome } from "@/lib/journal/saveIdempotency/types";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export type IdempotentJournalSaveHttpInput = {
  viewerEmail: string;
  saveOperationId: string;
  requestFingerprint: string;
  entryDateYmd: string;
  hasPhoto: boolean;
  portContext: ProductionJournalSavePortContext;
};

async function buildSuccessPayload(params: {
  viewerEmail: string;
  profileId: string;
  journalEntryId: string;
  parsedEntryDate: Date;
  reusedExisting: boolean;
  saveOperationId: string;
}) {
  const entry = await prisma.journalEntry.findFirst({
    where: {
      id: params.journalEntryId,
      email: params.viewerEmail,
    },
    select: entrySelect,
  });
  const donguriBalance = await sumDonguriBalance({
    email: params.viewerEmail,
    profileId: params.profileId,
  });
  const kanteiOrderExists = await profileHasKanteiOrder(
    params.viewerEmail,
    params.profileId,
  );
  const kanteiOrder = kanteiOrderExists
    ? await findKanteiOrderForProfile({
        viewerEmail: params.viewerEmail,
        profileId: params.profileId,
      })
    : null;
  const guardianColorName =
    kanteiOrder?.birthMonth != null &&
    kanteiOrder?.birthDay != null &&
    params.parsedEntryDate
      ? guardianColorNameForEntryDate({
          birthMonth: kanteiOrder.birthMonth,
          birthDay: kanteiOrder.birthDay,
          entryDateYmd: journalEntryDateToIsoDateInput(params.parsedEntryDate),
        })
      : null;

  return {
    entry: entry ? formatJournalEntryForApiResponse(entry) : null,
    kanteiOrderExists,
    guardianColorName,
    donguriBalance,
    code: "OK" as const,
    saveOperation: {
      saveOperationId: params.saveOperationId,
      status: "completed" as const,
      reused: params.reusedExisting,
    },
  };
}

export function mapIdempotencyOutcomeToStatus(
  outcome: ExecuteJournalSaveOperationOutcome,
): number {
  switch (outcome.kind) {
    case "completed":
      return 200;
    case "processing":
      return 202;
    case "idempotency_conflict":
      return 409;
    case "failed_final":
      return outcome.resultCode === "ACORN_INSUFFICIENT" ? 402 : 500;
    default:
      return 500;
  }
}

export async function runIdempotentProductionJournalSave(
  input: IdempotentJournalSaveHttpInput,
): Promise<NextResponse> {
  const actorKey = normalizeEmail(input.viewerEmail);
  const store = createPrismaJournalSaveOperationStore(prisma);
  const ports = createProductionJournalSavePorts(input.portContext);

  const outcome = await executeJournalSaveOperation(store, ports, {
    userId: actorKey,
    saveOperationId: input.saveOperationId,
    requestFingerprint: input.requestFingerprint,
    entryDate: input.entryDateYmd,
    hasPhoto: input.hasPhoto,
  });

  if (outcome.kind === "completed") {
    const body = await buildSuccessPayload({
      viewerEmail: input.viewerEmail,
      profileId: input.portContext.profileId,
      journalEntryId: outcome.journalEntryId,
      parsedEntryDate: input.portContext.parsedEntryDate,
      reusedExisting: outcome.reusedExisting,
      saveOperationId: input.saveOperationId,
    });
    return NextResponse.json(body, { status: 200, ...JSON_NO_STORE });
  }

  if (outcome.kind === "processing") {
    return NextResponse.json(
      {
        error: "保存処理が進行中です。同じ saveOperationId で再試行してください。",
        code: "SAVE_OPERATION_PROCESSING",
        saveOperation: {
          saveOperationId: input.saveOperationId,
          status: "processing",
          checkpoint: outcome.checkpoint,
        },
      },
      { status: 202, ...JSON_NO_STORE },
    );
  }

  if (outcome.kind === "idempotency_conflict") {
    return NextResponse.json(
      {
        error: "同じ保存操作IDに異なる内容が指定されました。",
        code: "SAVE_OPERATION_FINGERPRINT_MISMATCH",
        saveOperation: {
          saveOperationId: input.saveOperationId,
          status: "conflict",
        },
      },
      { status: 409, ...JSON_NO_STORE },
    );
  }

  // failed_final
  if (outcome.resultCode === "ACORN_INSUFFICIENT") {
    const balance = await sumDonguriBalance({
      email: input.viewerEmail,
      profileId: input.portContext.profileId,
    });
    return NextResponse.json(
      {
        error:
          "どんぐりが足りません。下書きとして残すか、どんぐりをためてから森に残してください。",
        code: "ACORN_INSUFFICIENT",
        balance,
        saveOperation: {
          saveOperationId: input.saveOperationId,
          status: "failed_final",
          resultCode: outcome.resultCode,
        },
      },
      { status: 402, ...JSON_NO_STORE },
    );
  }

  return NextResponse.json(
    {
      error: "あしあとの保存に失敗しました。",
      code: "SAVE_OPERATION_FAILED",
      saveOperation: {
        saveOperationId: input.saveOperationId,
        status: "failed_final",
        resultCode: outcome.resultCode,
      },
    },
    { status: 500, ...JSON_NO_STORE },
  );
}
