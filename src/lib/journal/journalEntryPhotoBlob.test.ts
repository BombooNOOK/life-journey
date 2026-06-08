import { afterEach, describe, expect, it } from "vitest";

import {
  journalPhotoBlobStoreId,
  resolveJournalPhotoBlobAuth,
} from "./journalEntryPhotoBlob";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("journalPhotoBlobStoreId", () => {
  it("falls back to BLOB_STORE_ID when dedicated store id is empty", () => {
    process.env.JOURNAL_PHOTO_BLOB_STORE_ID = "";
    process.env.BLOB_STORE_ID = "store_fallback";
    expect(journalPhotoBlobStoreId()).toBe("store_fallback");
  });

  it("prefers JOURNAL_PHOTO_BLOB_STORE_ID when set", () => {
    process.env.JOURNAL_PHOTO_BLOB_STORE_ID = "store_dedicated";
    process.env.BLOB_STORE_ID = "store_fallback";
    expect(journalPhotoBlobStoreId()).toBe("store_dedicated");
  });
});

describe("resolveJournalPhotoBlobAuth", () => {
  it("uses OIDC with fallback store id on Vercel-like env", () => {
    process.env.JOURNAL_PHOTO_BLOB_STORE_ID = "";
    process.env.BLOB_STORE_ID = "store_fallback";
    process.env.VERCEL_OIDC_TOKEN = "oidc-token";
    delete process.env.JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN;
    delete process.env.BLOB_READ_WRITE_TOKEN;

    expect(resolveJournalPhotoBlobAuth()).toEqual({
      mode: "oidc",
      storeId: "store_fallback",
      oidcToken: "oidc-token",
    });
  });

  it("falls back to BLOB_READ_WRITE_TOKEN when OIDC is unavailable", () => {
    delete process.env.JOURNAL_PHOTO_BLOB_STORE_ID;
    delete process.env.BLOB_STORE_ID;
    delete process.env.VERCEL_OIDC_TOKEN;
    process.env.JOURNAL_PHOTO_BLOB_READ_WRITE_TOKEN = "";
    process.env.BLOB_READ_WRITE_TOKEN = "rw-token";

    expect(resolveJournalPhotoBlobAuth()).toEqual({
      mode: "token",
      token: "rw-token",
    });
  });
});
