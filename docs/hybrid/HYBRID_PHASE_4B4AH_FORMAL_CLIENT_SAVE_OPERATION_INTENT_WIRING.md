# Hybrid Phase 4B-4AH｜Formal Client Save Operation Intent Wiring

**Status:** local implementation / local validation only  
**Production:** no deploy, no flag enable, no write

## Decision

The formal storage candidate is an **independent native SQLCipher database**:
`ljd_client_save_operation_intent`. It uses the existing Keychain-backed
encrypted database capability, and has no `localStorage` / `sessionStorage`
fallback. This preserves the requirement that an intent is durable before POST.

The record stores only:

- `saveOperationId`, normalized actor snapshot, optional draft reference
- request fingerprint, lifecycle status, timestamps, failure/recovery state
- `serverEntryId` once received

It never stores body text, photo/binary, cookie, token, or secret.

## Client/server responsibilities

| Record | Responsibility |
| --- | --- |
| Client intent | prevents this device from forgetting an operation |
| Server `JournalSaveOperation` | prevents duplicate execution/charge |

The client actor snapshot is `normalizeEmail(viewerEmail)` only for local
ownership isolation. The POST never sends `actorKey`; the server derives it
from its cookie/session identity.

## Lifecycle and HTTP mapping

| Server outcome | Client intent state | Automatic repost |
| --- | --- | --- |
| 200 completed | `completed` + `serverEntryId` | no |
| 202 processing | `awaiting_result` | no |
| 409 fingerprint mismatch | `recovery_required` | forbidden |
| 402 / final 5xx | `failed_final` | forbidden |
| response loss | `awaiting_result` | no background post |

Recovery is foreground-only and must use the same ID. 4B-4AH deliberately
does **not** add a server lookup endpoint; therefore a completed response-loss
recovery cannot run against Production yet. The injected local transport proves
the intended lookup path without inventing a new ID or reposting.

## Gates

The gates are separate:

1. native intent implementation exists;
2. an eligible client may attach `saveOperationId`;
3. foreground recovery may use a same-ID lookup;
4. the server has idempotency capability.

`runNewClientSaveOperation` defaults to **legacy** unless an authenticated,
server-provided **account-scoped** capability says enabled. It creates no intent
and sends no ID while disabled. A public `NEXT_PUBLIC_*` global enable is not a
rollout mechanism.

No capability endpoint exists today, so production remains safely legacy. A
future endpoint must be authenticated, server-side gated by
`LJD_JOURNAL_SAVE_IDEMPOTENCY_ENABLED`, and return account eligibility; it must
also provide a same-operation result lookup before recovery is offered.

## Existing UI integration point

The new-entry flow is `src/app/journal/page.tsx` `saveEntry`:

`JournalFootprintActions → saveEntry → POST /api/journal → success transition →
preview/calendar navigation`.

The intended integration is a small UI adapter that supplies the in-memory
request payload to `ClientSaveOperationTransport.post`. The adapter must call
the application service before `fetch`; it must retain the existing legacy path
when the capability is disabled. The service remains outside React components.

This phase intentionally does not wire the native store into browser page boot:
the existing encrypted database capability is explicitly native-only and
requires an explicit secure bootstrap. Wiring web UI to browser storage would
violate the storage decision.

## Account deletion

The server account deletion transaction already removes server JSO rows. The
client store exposes `deleteByActor` for a future authenticated account-delete
client teardown. This needs a native lifecycle hook/secure bootstrap decision
before client rollout; otherwise an orphaned local metadata record would remain
on the device. No server account-delete behavior changed in this phase.

## Explicit exclusions

- no PoC branch merge
- no local intent/mirror/outbox coupling
- no server capability or lookup endpoint
- no feature enable, deploy, Production POST/DB action, Vercel change
- no automatic background retry or email-change feature
