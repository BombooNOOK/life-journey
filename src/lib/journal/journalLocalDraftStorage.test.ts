import { describe, expect, it } from "vitest";

import {
  buildJournalLocalDraftKey,
  buildJournalLocalDraftPayload,
  isMeaningfulNewJournalLocalDraft,
  journalLocalDraftDiffersFromSnapshot,
  parseJournalLocalDraftPayload,
  snapshotsEqual,
} from "./journalLocalDraftStorage";

describe("buildJournalLocalDraftKey", () => {
  it("新規は email + profileId + 記録日", () => {
    expect(
      buildJournalLocalDraftKey({
        email: "User@Example.com",
        profileId: "p1",
        mode: "new",
        entryDateYmd: "2026-06-21",
      }),
    ).toBe("lj-journal-draft:v1:user@example.com:p1:new:2026-06-21");
  });

  it("編集は email + profileId + entryId", () => {
    expect(
      buildJournalLocalDraftKey({
        email: "a@b.c",
        profileId: "",
        mode: "edit",
        editingId: "entry-1",
      }),
    ).toBe("lj-journal-draft:v1:a@b.c:_default:edit:entry-1");
  });
});

describe("parseJournalLocalDraftPayload", () => {
  it("有効な JSON を復元する", () => {
    const raw = JSON.stringify({
      version: 1,
      savedAt: "2026-06-21T10:00:00.000Z",
      entryDate: "2026-06-21",
      mood: "calm",
      activity: "record_anyway",
      content: "テスト",
      contentFontMode: "generous",
      companionType: "owl",
    });
    const parsed = parseJournalLocalDraftPayload(raw);
    expect(parsed?.content).toBe("テスト");
    expect(parsed?.contentFontMode).toBe("generous");
  });

  it("不正な mood は null", () => {
    const raw = JSON.stringify({
      version: 1,
      savedAt: "2026-06-21T10:00:00.000Z",
      entryDate: "2026-06-21",
      mood: "invalid",
      activity: "record_anyway",
      content: "x",
      contentFontMode: "standard",
    });
    expect(parseJournalLocalDraftPayload(raw)).toBeNull();
  });
});

describe("isMeaningfulNewJournalLocalDraft", () => {
  const base = buildJournalLocalDraftPayload({
    entryDate: "2026-06-21",
    mood: "calm",
    activity: "record_anyway",
    content: "",
    contentFontMode: "standard",
  });

  it("本文が空で初期値のみなら false", () => {
    expect(isMeaningfulNewJournalLocalDraft(base, "2026-06-21")).toBe(false);
  });

  it("本文があれば true", () => {
    expect(
      isMeaningfulNewJournalLocalDraft({ ...base, content: "メモ" }, "2026-06-21"),
    ).toBe(true);
  });
});

describe("journalLocalDraftDiffersFromSnapshot", () => {
  it("contentFontMode の差分を検知する", () => {
    const payload = buildJournalLocalDraftPayload({
      entryDate: "2026-06-21",
      mood: "calm",
      activity: "record_anyway",
      content: "abc",
      contentFontMode: "compact",
    });
    expect(
      journalLocalDraftDiffersFromSnapshot(payload, {
        entryDate: "2026-06-21",
        mood: "calm",
        activity: "record_anyway",
        content: "abc",
        contentFontMode: "standard",
      }),
    ).toBe(true);
  });
});

describe("snapshotsEqual", () => {
  it("同一スナップショット", () => {
    const snap = {
      entryDate: "2026-06-21",
      mood: "calm" as const,
      activity: "record_anyway" as const,
      content: "x",
      contentFontMode: "standard" as const,
    };
    expect(snapshotsEqual(snap, { ...snap })).toBe(true);
  });
});
