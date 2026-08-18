import {
  AI7_PHOTO_SAVE_OPERATION_ID,
  AI7_TEST_PROFILE_ID,
  AI7_TEXT_SAVE_OPERATION_ID,
} from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/constants";
import type { JournalCreatePayload } from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";

/** 1×1 PNG. Built-in; never loaded from the device photo library. */
export const AI7_TEST_PHOTO_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const baseFields = {
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple_plain",
  contentFontMode: "standard",
  entryDate: "2026-08-18",
  profileId: AI7_TEST_PROFILE_ID,
  includeInBook: true,
} as const;

export function ai7TextTestPayload(): JournalCreatePayload {
  return {
    ...baseFields,
    content: "AI7 isolated recovery text",
    saveOperationId: AI7_TEXT_SAVE_OPERATION_ID,
  };
}

export function ai7PhotoTestPayload(): JournalCreatePayload {
  return {
    ...baseFields,
    content: "AI7 isolated recovery photo",
    photoDataUrl: AI7_TEST_PHOTO_DATA_URL,
    saveOperationId: AI7_PHOTO_SAVE_OPERATION_ID,
  };
}
