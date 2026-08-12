/**
 * Life Journey Diary｜Local Save Operation Intent Spec
 *
 * Status: Pre-Implementation / Local Save Operation Intent Candidate
 * Updated: 2026-08-13
 * Branch: feat/local-save-operation-intent-poc
 * Base: feat/server-journal-save-idempotency-poc @ 6800db5
 * Formal main (unmerged): a160d25743d82713b3d218abacd2d26833b0bc9b
 * Scope: Strategy B Local durable intent PoC (domain + SQLCipher + Simulator).
 * Forbidden now: production POST wiring, Neon migrate, automatic replay,
 * background recovery, production mirror routing, Vercel deploy, main merge.
 *
 * Companion:
 * - docs/hybrid/HYBRID_PHASE_4B4O_LOCAL_SAVE_OPERATION_INTENT_POC.md
 * - docs/product/ljd-journal-save-idempotency-spec.md
 * - docs/product/ljd-save-operation-reconciliation-spec.md
 * - docs/hybrid/HYBRID_PHASE_4B4N_SERVER_SAVE_IDEMPOTENCY_POC.md
 */

# Life Journey Diary｜Local Save Operation Intent Spec

**Status:** Pre-Implementation / Local Save Operation Intent Candidate  
**ラベル:** **Designed candidate**＝第一候補／**Open**＝未確定／**Forbidden now**＝本Phase実装禁止

---

## 0. Purpose

Before Server POST, persist **saveOperationId** (and minimal operational metadata) on-device so Window B/C recovery can look up or re-drive the same operation without inventing a new identity after crash.

**Not** mirror outbox. Outbox remembers post-confirm mirror work; intent remembers that a Server save operation was started.

---

## 1. Actor identity audit (code)

| Question | Finding |
| --- | --- |
| Auth for `POST /api/journal` | Cookie `lj_user_email` via `getViewerEmailFromCookie()` — not Firebase UID |
| Firebase UID in Server DB? | **No** — not stored; session sync uses email only |
| Stable account table non-email? | `AccountSettings.email` unique; no `User.uid` |
| `JournalEntry` ownership | `email` (+ `profileId` scope) |
| Local SQLite actor column | None (device store) |

**Decision (this PoC):** keep **`actorKey` = normalized viewer email**, aligned with 4B-4N `userId` and Journal ownership.  
**Do not** switch to Firebase UID by speculation. If a stable non-email identity becomes first-class for Journal ownership later, re-evaluate unique scope together with Server.

---

## 2. Storage / security

| Choice | Candidate A |
| --- | --- |
| Location | Application Support — independent SQLite file |
| Encryption | SQLCipher via `@capacitor-community/sqlite` `mode:"secret"` |
| Keychain | **Reuse** plugin built-in secret (same as outbox / candidate journal) |
| Protection | `NSFileProtectionComplete` |
| Backup | **Exclude** (transient operational state; not Moving Package) |
| Separation | Own DB — never columns on mirror outbox |

Constraint: backup/restore may drop intents → Server-completed ops can be “forgotten” locally → **lightweight reconciliation remains insurance** (4B-4M).

---

## 3. Schema (metadata only)

`intentId`, `saveOperationId` (**unique**), `actorKey`, `status`, `serverEntryId?`, `requestFingerprint`, `draftRef?`, `createdAt`, `lastAttemptAt?`, `completedAt?`, `failureCode?`

**Forbidden:** content, photo, caption, secrets, tokens.

---

## 4. Draft / payload recovery audit

| Store | Attempt-scoped? | Content+photo? |
| --- | --- | --- |
| Server `JournalDraft` | No (email+profile+dateKey) | Possible but mutable / deleted after save |
| `journalLocalDraftStorage` | No | Content only; plaintext localStorage; no photo |
| Intent / Operation | Yes | Fingerprint only |

**Verdict:** no safe attempt-scoped `draftRef` today. Schema keeps nullable `draftRef` for future.  
**not_found + unresolved payload → `recovery_required`.** Do **not** auto-POST empty/partial body. Do **not** copy life-record payload into intent DB this Phase.

---

## 5. Lifecycle

```
prepared → awaiting_result → server_completed → completed
                         ↘ server_failed_final
                         ↘ recovery_required
```

Mandatory order: **generate saveOperationId → durable intent → Server POST** (POST-before-intent forbidden).

Processing: developer/manual re-check only — **no** automatic timer / background worker.

---

## 6. Lookup integration (4B-4N)

`getJournalSaveOperationResult(saveOperationId)`:

| Result | Intent |
| --- | --- |
| `not_found` | retry only if draft resolvable; else `recovery_required` |
| `processing` | stay `awaiting_result` |
| `completed` | bind `serverEntryId` → build mirror enqueue candidate |
| `failed_final` | `server_failed_final` (keep row; no duplicate POST) |

Fingerprint: reuse `buildJournalSaveRequestFingerprint` (same canonical as Server).

---

## 7. Mirror bridge

`server_completed` + healthy `technical_active` resolve → `MirrorEnqueueCandidate` (`EnqueueInput`).  
Production outbox write / generation persistence on Server: **forbidden this Phase**.

---

## 8. Next Phase lock

After 4B-4O PASS → **4B-4P Non-production Prisma Idempotency Integration**  
→ then **4B-4Q** developer/internal end-to-end wiring.  
**Do not** jump to production POST from 4B-4O.

---

## 9. Rollout gates

| Gate | Now |
| --- | --- |
| Local intent domain + SQLCipher PoC | 4B-4O |
| Production POST / Neon migrate | Forbidden |
| Automatic save replay | Forbidden |
| main merge / general rollout | No |
