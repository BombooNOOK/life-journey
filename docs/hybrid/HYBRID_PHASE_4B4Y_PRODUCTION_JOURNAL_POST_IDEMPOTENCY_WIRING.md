# Hybrid Phase 4B-4Y｜Production Journal POST Idempotency Wiring

**Status:** Code complete (feature default OFF) — **no Production enable / deploy / POST**  
**Date:** 2026-08-14  
**Prior:** 4B-4X PASS = A（条件付き）; actorKey SoT = `normalizeEmail(viewerEmail)`

---

## 1. Purpose

Wire **server-side** `JournalSaveOperation` idempotency into Production `POST /api/journal`, behind a default-OFF feature gate.

**Out of scope this Phase:** Production feature enable, Production POST execution, Local Save Operation Intent 本番接続, mirror/outbox, email change, Firebase UID migration, main merge.

---

## 2. Request contract — `saveOperationId`

| Rule | Spec |
| --- | --- |
| Who generates | **Client** (opaque, stable) |
| Distinct from | `JournalEntry.id`, Local generation id |
| Retry | **Same** `saveOperationId` |
| New save | **New** id |
| Length | 16–64 |
| Charset | `[0-9A-Za-z_-]+` |

### Missing / invalid

| Case | Feature ON behavior |
| --- | --- |
| Absent / null / `""` | **MISSING** → **legacy path** (compat; never invent server IDs) |
| Present but invalid | **INVALID** → **400** `BAD_SAVE_OPERATION_ID` |
| Valid | JSO orchestration |

Server **must not** mint a fresh operation id per request (breaks response-loss recovery).

---

## 3. Actor key

- Source: cookie `lj_user_email` → `getViewerEmailFromCookie()`  
- `actorKey = normalizeEmail(viewerEmail)` (server only)  
- Client **must not** send `actorKey`  
- Email-change remap Gate remains **OPEN** (4B-4X X6) — email change ship **forbidden** until Gate closed

---

## 4. Request fingerprint

`buildProductionJournalSaveFingerprint`:

- `sha256(content)` + entryDate + photoIdentity (hash / none / remove)  
- + profileId + mood + activity + companion + theme + font + includeInBook  
- **No** raw body / photo bytes / secrets stored on JSO row  

Mismatch → outcome `idempotency_conflict` → **HTTP 409** `SAVE_OPERATION_FINGERPRINT_MISMATCH`.

---

## 5. Server orchestration

Checkpoints (4B-4N):

`claimed` → `entry_created` → `photo_completed` → `donguri_settled` → `completed`

Guarantees:

- Same operation retry does **not** create a second JournalEntry  
- Donguri not double-charged (`entry:{journalEntryId}` via existing `chargeDiarySaveAcorns`)  
- Response-loss retry returns same completed result  
- Concurrent POST converges on one operation (unique + CAS)  
- Mid-flight resume from last successful checkpoint  

Ports: `productionJournalSavePorts.ts` (create / photo / charge / compensating delete).

---

## 6. Donguri idempotency alignment

Existing ledger dedup key: `entry:{journalEntryId}`.

JSO fixes `journalEntryId` for the operation → charge runs at most once for that entry.  
**No** parallel saveOperationId-based charge dedup added.

---

## 7. Response contract

| Outcome | HTTP | Notes |
| --- | --- | --- |
| completed | **200** | `entry`, `code: OK`, `saveOperation: { saveOperationId, status: completed, reused }` |
| processing | **202** | `SAVE_OPERATION_PROCESSING` + checkpoint |
| fingerprint mismatch | **409** | `SAVE_OPERATION_FINGERPRINT_MISMATCH` |
| ACORN insufficient | **402** | `ACORN_INSUFFICIENT` + `failed_final` |
| other failed_final | **500** | `SAVE_OPERATION_FAILED` |

`reused: true` when completed short-circuit (retry after success).

---

## 8. Legacy compatibility & rollout

| Stage | Behavior |
| --- | --- |
| Flag **OFF** (default) | Exact current Production POST |
| Flag ON + no id | Legacy path |
| Flag ON + eligible client sends id | JSO path |
| Later (separate Phase) | Require `saveOperationId` |

Flag: `LJD_JOURNAL_SAVE_IDEMPOTENCY_ENABLED` = `YES` \| `1`

---

## 9. Client wiring boundary

This Phase completes **server route alone**.  
Local Save Operation Intent → Production POST wiring = **next Phase candidate**.

---

## 10. Account delete (4B-4X X4)

**Decision (SoT):** On account delete, **delete** `JournalSaveOperation` rows where `actorKey = normalizeEmail(email)`.

Rationale: JSO holds actorKey + fingerprints + entry ids — personal-data cleanup should remove them with Journal ownership data. Retaining orphaned JSO after account wipe is not required for product.

**Code:** `deleteUserAccount.ts` now includes `journalSaveOperation.deleteMany({ where: { actorKey: email } })`.

| Item | Status |
| --- | --- |
| Account delete JSO cleanup | **Implemented** (4B-4Y) |
| Production rollout still requires flag OFF until internal verify | **Yes** |

---

## 11. Email-change blocker (maintained)

| Gate | Status |
| --- | --- |
| Email-change remap Gate (X6) | **OPEN** — ship email change **forbidden** until closed with Journal + JSO remap |
| Firebase UID migration | **Not this Phase** |

---

## 12. Files

| Path | Role |
| --- | --- |
| `src/app/api/journal/route.ts` | Feature-gated branch into JSO |
| `journalSaveIdempotencyGate.ts` | Default-OFF gate |
| `saveOperationId.ts` | Request contract parse |
| `productionRequestFingerprint.ts` | Fingerprint |
| `productionJournalSavePorts.ts` | Side-effect ports |
| `runIdempotentProductionJournalSave.ts` | HTTP mapping |
| `deleteUserAccount.ts` | JSO cleanup |
| `productionJournalSaveIdempotencyWiring.test.ts` | Gate/contract/HTTP tests |

---

## 13. Tests / build

| Test Files | 26 passed / 2 skipped |
| Tests | **222 passed** / 10 skipped |
| `./node_modules/.bin/tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| Production DB / POST / feature enable | **Not run** (forbidden) |

Core scenarios covered by `executeJournalSaveOperation.test.ts` + wiring tests:

fresh / retry / response-lost / concurrent / fingerprint / cross-actor / resume / insufficient / feature OFF / legacy missing id.

---

## 14. Verdict

| Question | Answer |
| --- | --- |
| Server POST idempotency wiring complete (flag OFF)? | **A** |
| Proceed to Production **internal route verification** (still no user-facing enable)? | **A/B — see chat** |
| Production feature enable / deploy? | **No** |
| main merge? | **No** |
