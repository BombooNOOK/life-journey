# 4B-4AI-4 Account Delete Native Secure Teardown

## Current flow

```text
AccountDeleteForm (Firebase authenticated email snapshot)
  → begin native Save Intent teardown admission
  → POST /api/account/delete
  → cookie-derived viewer → deleteUserAccount transaction
      → JournalSaveOperation + JournalSaveIdempotencyRollout cleanup
  → server success
  → native deleteByActor(normalizeEmail(snapshot))
  → Firebase logout / navigation
```

The server route never accepts an actor key from the client. The server deletion
transaction remains the authority for server rows.

## Native policy

- Intent DB schema v2 adds encrypted, metadata-only `client_save_operation_deletion_tombstone`
  rows (`actorKey`, created/updated timestamps). The v1→v2 migration is additive
  and retains all existing intent rows.
- A tombstone is durably written before the server request. Server failure clears
  it; if clearing fails, suppression remains fail-closed.
- Native secure-store readiness is checked before the irreversible request.
  Browser is `unsupported_platform` and needs no native row cleanup.
- If the server delete fails, native rows remain and the actor activity guard is
  released.
- If the server delete succeeds, the actor is permanently suppressed for the
  current process before `deleteByActor` runs. A native cleanup failure never
  permits recovery, continuation, or a new Journal create from that actor.
- `deleteByActor` deletes all target actor rows and verifies no recoverable
  target rows remain. Other actors are untouched.
- The SQLCipher DB file and plugin Keychain secret remain an empty reusable
  container. Account deletion does not delete either.
- Normal logout does not call this teardown.

## Identity and future-account boundary

Actor identity is `normalizeEmail(viewerEmail)` today. Successful cleanup leaves
zero local rows for that actor, preventing old metadata from appearing if the
same email is later registered again. Email identity reuse and migration to an
immutable account identifier remain open design gates.
