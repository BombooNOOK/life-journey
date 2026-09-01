import { describe, expect, it } from "vitest";

import {
  canonicalizeExactJournalSavePayload,
  fingerprintCanonicalJournalSaveRequest,
  JOURNAL_PHOTO_DATA_URL_MAX_CHARS,
} from "@/lib/journal/clientSaveIntent/exactPayloadCanonical";
import { buildProductionJournalSaveFingerprint } from "@/lib/journal/saveIdempotency/productionRequestFingerprint";
import { createClientSaveOperationId } from "@/lib/journal/clientSaveIntent/saveOperationId";

const OP = "jso_1234567890abcdefghijklmnopqrstuv";

const basePayload = {
  content: "  あしあと  ",
  entryDate: "2026-08-18",
  profileId: "profile_fixed_1",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "cute",
  contentFontMode: "standard",
  includeInBook: true,
};

describe("AI-7.1 exact payload canonicalization", () => {
  it("stores trimmed content, fixed profileId, and normalized theme in request JSON", () => {
    const result = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload: basePayload,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.content).toBe("あしあと");
    expect(result.request.profileId).toBe("profile_fixed_1");
    expect(result.request.designTheme).toBe("simple_plain");
    const parsed = JSON.parse(result.requestJson) as Record<string, unknown>;
    expect(parsed.saveOperationId).toBe(OP);
    expect(parsed.designTheme).toBe("simple_plain");
    expect(parsed).not.toHaveProperty("photoDataUrl");
    expect(parsed).not.toHaveProperty("photoRemoved");
    expect(parsed).not.toHaveProperty("email");
    expect(result.requestFingerprint).toBe(
      buildProductionJournalSaveFingerprint({
        content: "あしあと",
        entryDate: "2026-08-18",
        profileId: "profile_fixed_1",
        mood: "calm",
        activity: "record_anyway",
        companionType: "owl",
        designTheme: "simple_plain",
        contentFontMode: "standard",
        includeInBook: true,
        photoIdentity: "none",
      }),
    );
    expect(result.requestFingerprint).toContain("theme:simple_plain");
    expect(fingerprintCanonicalJournalSaveRequest(result.request)).toBe(
      result.requestFingerprint,
    );
  });

  it("keeps photoDataUrl when present and does not invent photo keys when absent", () => {
    const withPhoto = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload: { ...basePayload, photoDataUrl: "data:image/png;base64,aaa" },
    });
    expect(withPhoto.ok).toBe(true);
    if (!withPhoto.ok) return;
    expect(JSON.parse(withPhoto.requestJson).photoDataUrl).toBe(
      "data:image/png;base64,aaa",
    );
    expect(JSON.parse(withPhoto.requestJson)).not.toHaveProperty("photoRemoved");

    const without = canonicalizeExactJournalSavePayload({
      saveOperationId: createClientSaveOperationId(),
      payload: basePayload,
    });
    expect(without.ok).toBe(true);
    if (!without.ok) return;
    expect(JSON.parse(without.requestJson)).not.toHaveProperty("photoDataUrl");
  });

  it("rejects secrets, oversized photos, and missing profileId", () => {
    expect(
      canonicalizeExactJournalSavePayload({
        saveOperationId: OP,
        payload: { ...basePayload, email: "x@example.com" },
      }).ok,
    ).toBe(false);
    expect(
      canonicalizeExactJournalSavePayload({
        saveOperationId: OP,
        payload: {
          ...basePayload,
          photoDataUrl: `data:image/png;base64,${"a".repeat(JOURNAL_PHOTO_DATA_URL_MAX_CHARS)}`,
        },
      }),
    ).toMatchObject({ ok: false, code: "photo_too_large" });
    expect(
      canonicalizeExactJournalSavePayload({
        saveOperationId: OP,
        payload: { ...basePayload, profileId: "" },
      }),
    ).toMatchObject({ ok: false, code: "profile_id_required" });
  });
});
