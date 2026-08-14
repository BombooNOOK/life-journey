# Hybrid Phase 4B-4AC｜Slim Production Release Manifest

**Scope:** Local-only release candidate. No push, Preview, Production deploy, merge, or Vercel configuration change.

**Base:** `origin/main` = `a160d25743d82713b3d218abacd2d26833b0bc9b`

**Local branch:** `release/server-idempotency-off-prep`

## Promotion manifest

| Source commit | Files / unit | Purpose | Dependency | Runtime |
| --- | --- | --- | --- | --- |
| `6800db5` | `executeJournalSaveOperation`, request fingerprint/types, store contract | checkpoint/retry/concurrent core | none | yes |
| `205b5a3` | Prisma JSO store + `schema.prisma` model | durable store | core | yes |
| `e85b982` | `20260813140000_add_journal_save_operation` | official additive schema | Prisma model | yes |
| `b95e2fa` | `scripts/vercel-build.mjs`, package build commands | Strategy C: application build never migrates | none | deployment build |
| `5d932ab` | gate, production ports/orchestrator, route wiring, account deletion | default-OFF server feature | all above | yes |
| `0f23564` | route E2E + account-delete audit | release validation | wiring | no |
| 4B-4AC local-only | account-delete integration gate | zero/owned/rollback verification | JSO model + deletion | no |

## Cherry-pick classification

No original commit is safe to promote wholesale:

- `6800db5`, `205b5a3`, `e85b982`: include formal runtime/test units; exclude `prisma/poc/**` and migration probe scripts.
- `b95e2fa`: include Strategy C build entry only; exclude controlled-migration operator script from this application release.
- `5d932ab`: formal runtime commit, safe only after prior dependencies are present.
- `0f23564`: test/docs only.

## Explicit exclusions

The local branch contains no additions from:

- 4B-4AA operator scripts, Production verification harness, test actor allowlists, or Production WRITE gates
- `/preview/save-intent-poc`, `/preview/save-operation-e2e`, `/preview/save-wiring-*`
- Local Save Operation Intent, mirror/outbox, generation registry, reconciliation PoCs
- production cleanup/verification CLIs and their secrets/gates
- `prisma/poc/**`, `scripts/poc/4b4u-*`, or `controlled-production-migrate.*`

Documentation remains source-only and does not create a runtime route, public API, or Vercel function.

## Feature-OFF baseline

`LJD_JOURNAL_SAVE_IDEMPOTENCY_ENABLED` is absent:

- `POST /api/journal` without `saveOperationId` follows legacy path.
- Valid or invalid supplied `saveOperationId` is ignored by the legacy path.
- photo and insufficient-donguri behavior remain legacy.
- no `JournalSaveOperation` row is written by journal POST.

The one feature-OFF behavioral addition is account deletion: its transaction removes only
`JournalSaveOperation` rows with `actorKey = normalizeEmail(account email)`.

## Runtime env allowlist

| Name | Release behavior / deploy requirement |
| --- | --- |
| `LJD_JOURNAL_SAVE_IDEMPOTENCY_ENABLED` | must be absent / OFF |
| `DATABASE_URL` | existing Production application DB connection only; never supplied through operator scripts |

These names must **not** be saved in Vercel runtime environments:

- `LJD_INTERNAL_JOURNAL_ROUTE_VERIFY_*`
- `LJD_ALLOW_PRODUCTION_INTERNAL_ROUTE_VERIFY*`
- `LJD_INTERNAL_ROUTE_VERIFY_CLEANUP_*`
- `LJD_ALLOW_PRODUCTION_INTERNAL_ROUTE_VERIFY_CLEANUP*`
- `LJD_ALLOW_PRODUCTION_JSO_*`

## Preview safety

`DATABASE_URL` has previously been observed as shared by Preview and Production. Whether a
Git push automatically creates a Preview deployment is **unknown** without Dashboard/project
read-only evidence. Therefore this branch remains local-only and must not be pushed.

Candidate Production-only procedure after a separate approval:

1. Dashboard read-only check: Preview auto-deploy policy and env-name scopes.
2. Disable/avoid Preview creation before publishing a release ref.
3. Confirm feature flag remains absent.
4. Promote the reviewed release through the approved Production-only mechanism.

## Rollback

Code rollback only; feature remains OFF. Keep the additive JSO table and migration applied.
Do not use migration down or Snapshot Restore as the normal rollback mechanism.
