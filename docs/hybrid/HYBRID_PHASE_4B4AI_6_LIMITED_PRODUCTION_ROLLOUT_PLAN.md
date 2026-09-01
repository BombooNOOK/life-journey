# 4B-4AI-6｜Limited Production Rollout Plan

## Status and boundary

**Status:** Planning only. No Production execution is authorized by this
document.

- AI-5 runtime closure: **PASS A**
- Candidate: one dedicated internal/test account only
- General/public rollout: **B** — unchanged
- AI-6 execution: **not started**

This planning phase performs no Production or Neon write, migration, deploy,
push, environment change, feature enable, rollout-row change, account setup,
or Production Journal verification.

## Evidence and current-state boundary

### What Git proves

`origin/main` and local `main` point to `dd096a0` at this audit. The slim
release manifest at
`docs/hybrid/HYBRID_PHASE_4B4AC_SLIM_RELEASE_MANIFEST.md` identifies the
already-reviewed server-idempotency foundation:

- `JournalSaveOperation` core and the additive
  `20260813140000_add_journal_save_operation` migration
- Strategy C Vercel build behavior: application builds never migrate
- default-OFF Journal POST idempotency wiring

The current planning branch includes the AI-1 through AI-5 chain beginning at
`307a448` and ending at `fae62a4`, including:

- capability and lookup contracts (`5dca554`)
- native save-intent bootstrap, common create orchestrator, and foreground
  recovery (`a9b233a` through `d5a4ad4`)
- account-delete teardown/tombstone wiring (`84a8cfc` through `f98cbaa`)
- local-only runtime E2E harness and closure (`2444a94`, `4dbd937`,
  `fae62a4`)

### What Git does not prove

Git cannot prove the SHA currently deployed by Vercel, the active Production
environment values, whether the rollout migration is applied to Production,
or current database counts. The slim manifest explicitly describes itself as
a local candidate and notes that Preview/Production database scope needs
Dashboard read-only evidence. These are Stage 0 facts to be collected before
any execution approval; this plan does not assume them.

## Required minimal release slice

The future release must be assembled as a reviewed slim slice, not by
promoting this branch wholesale.

### A. Production server and schema

- `JournalSaveOperation` model/store and existing official migration.
- `JournalSaveIdempotencyRollout` model plus its additive migration:
  `20260814231500_add_journal_save_idempotency_rollout`.
- `GET /api/journal/save-capability`.
- authenticated same-operation lookup route.
- Journal POST’s default-OFF idempotent branch and legacy compatibility.
- account-delete transaction cleanup of both JSO and rollout rows.
- Strategy C build entry: migration remains an operator-only action.

### B. Native application

- SQLCipher metadata-only Save Intent store and secure bootstrap.
- common Journal and Companion create-save orchestrator.
- foreground lookup recovery and recovery presentation fixes.
- account-delete `deleteByActor` teardown and durable tombstone cleanup.

### C. Explicitly excluded local/test-only code

Do not include as a Production runtime surface:

- `/api/local-e2e/*`, local fixed-actor bridge, and local session persistence
- local E2E fault store/adapters, response-loss/lookup/cleanup faults
- local fixture seed/cleanup helpers
- `/preview/local-e2e-harness` and local-only diagnostics

The current code structurally gates the local harness on non-production,
`LJD_ENABLE_LOCAL_E2E_HARNESS=YES`, loopback host, a disposable local
database, and an environment-owned fixed actor. The session route ignores a
client-supplied email. Production must continue to return 404 for the harness,
and no Production activation plan exists for it.

Residual coupling to note before slim release review: formal Journal create
and account-delete paths currently wrap production deps with local fault
adapters. Those adapters are inert unless a local process-memory fault is
armed, and the arming control plane is gated away in Production. Execution
planning should still decide whether the slim release tree-shakes or retains
that inert wrapper surface.

### D. Documentation and tests

Release validation tests and runbooks are included only when they do not
create a Production route, mutation endpoint, or deployment behavior.

## Migration dependency

The rollout migration is required before deploying any server build that
queries or deletes `JournalSaveIdempotencyRollout`. Account deletion invokes
that cleanup in its database transaction; deploying that code before the
table exists risks runtime failure.

Static audit of
`prisma/migrations/20260814231500_add_journal_save_idempotency_rollout/migration.sql`:

- creates one new table only
- `enabled` defaults to `false`, so an empty/new table admits no actor
- creates one unique index on `actorKey`
- contains no `DROP`, `ALTER`, data rewrite, or unrelated-table change

Do not use a down migration or database restore as ordinary rollback. The
normal safety response is disabling admission; the additive table remains.

### Operator tooling dependency

This worktree contains the rollout migration SQL but excludes the controlled
Production migrate runner as part of the slim-release boundary. The
established snapshot / fingerprint / pending-allowlist operator scripts live
in the sibling mainline checkout (`scripts/controlled-production-migrate.mjs`
and related preflight docs). Those scripts currently hardcode the earlier
`JournalSaveOperation` pending-migration allowlist. Before Stage 2 execution
approval, the operator allowlist must be revised to the exact approved
pending set for the rollout migration and must not silently apply a larger
pending set.

## Eligibility and coexistence invariants

Protocol v1 is admitted only when all conditions hold:

```text
global idempotency gate is ON
AND actor rollout row is enabled
AND rollout protocolVersion = 1
AND native secure intent store is ready
```

- Empty rollout table means eligible actor count is zero, even with global ON.
- Global OFF means all new saves use legacy behavior.
- Browser/Web remains legacy because it has no native secure intent store.
- Existing owner operations retain read-only lookup recovery after disable;
  disable must not create a new write admission.
- Actor identity is normalized email today. The first cohort must not change
  its email while enrolled; immutable-account identity remains a general
  rollout gate.

## Preview shared-database risk

The slim manifest records that Preview and Production have previously shared
`DATABASE_URL` scope. Git does not prove the current Dashboard policy.

The first execution candidate is therefore a **main-only controlled release**,
not a non-main push that can auto-create Preview. Before any publication,
Stage 0 must obtain read-only Dashboard evidence for:

1. Preview auto-deploy behavior.
2. Environment scope for the database connection and feature gate.
3. A Production-only publication path that avoids Preview execution against
   the shared database.

If any item is unknown, the execution plan stops before migration or deploy.

## Proposed execution sequence

Every stage is separately approved. “Pass” allows progression; “stop” leaves
admission OFF and requires a new decision.

### Stage 0 — Production read-only preflight

Confirm deployed SHA, environment names/scopes, migration state, feature flag
state, rollout-table count, and Preview policy without writing data.

**Stop:** any mismatch with the reviewed release slice, uncertain database
scope, non-empty unexpected cohort, or feature already ON.

### Stage 1 — manual snapshot approval

Use the established controlled-production migration runbook: explicit
approval, database fingerprint, approved migration allowlist, additive SQL
review, and pre-snapshot confirmation.

**Stop:** snapshot/fingerprint/allowlist evidence is absent or stale.

### Stage 2 — controlled rollout-table migration

Run only the audited rollout-table migration through the approved operator
process, not through a Vercel build.

**Stop:** pending migration list differs from the approved singleton, or the
operator cannot prove the target database identity.

### Stage 3 — post-migration verification

Read-only verification: migration recorded, table exists, unique index exists,
row count is zero, and no unrelated schema/database count changed.

**Stop:** any non-additive observation or unexpected row.

### Stage 4 — slim server/native release

Release only the classified A+B slice through the approved Production-only
path. Keep the global gate OFF and rollout table empty.

**Stop:** release artifact differs from reviewed SHA/slice, Preview cannot be
excluded, or default-OFF smoke is not legacy-compatible.

### Stage 5 — feature-OFF smoke

Verify normal legacy Journal behavior through the existing safe process. Do
not create a rollout row or enable the global gate in this stage.

**Stop:** JSO is created for a legacy save, capability becomes true, or an
unrelated actor is affected.

### Stage 6 — nominate one internal/test account

After explicit approval, identify a dedicated internal/test account. Do not
use an ordinary user or assume any personal account. Confirm email will not
change during the observation window.

**Stop:** account identity, ownership, device readiness, or consent is not
unambiguous.

### Stage 7 — one-account eligibility and global gate

Create exactly one enabled protocol-v1 rollout row, then enable the global
gate. Re-read the cohort and capability result before any save.

The order is deliberate: global ON with an empty table still admits nobody;
the enabled row alone remains inert while global is OFF.

**Stop:** cohort cardinality is not exactly one, capability is true for a
non-eligible actor, or browser/web begins the protocol.

### Stage 8 — minimal controlled Journal verification

For the dedicated account and approved native build only:

- secure intent is ready
- capability is enabled
- one normal Journal save
- one Entry, one `diary_save` ledger record, one completed JSO, and completed
  client intent

Do not inject response loss or other faults in Production in the first
rollout.

**Stop:** duplicate Entry/charge, nonterminal/unknown JSO, processing stuck,
recovery-required unexpectedly, intent corruption, or any actor isolation
failure.

### Stage 9 — observe, do not expand

Observe the one account over an approved window. No second account, Companion
expansion, fault injection, or public rollout is implied by a clean result.

## Observation and stop criteria

Observe only metadata/counts/statuses necessary for safety:

- JSO count and terminal status for the enrolled actor
- corresponding JournalEntry and `diary_save` counts
- duplicate detection
- client intent and recovery presentation state
- account-delete interaction

Do not log journal body, photo data, tokens, secrets, or database URLs.

Immediately prohibit expansion if any of these occur:

- duplicate Entry or `diary_save`
- unexpected actor affected
- JSO stuck or unknown
- native intent corruption
- capability true for a non-eligible actor
- new protocol begins while rollout is OFF
- account-delete anomaly
- unexplained Production database count change

## Disable, rollback, and version skew

The first safety action is admission disable, not schema reversal:

1. disable the enrolled rollout row and/or global gate
2. preserve existing-operation read-only lookup recovery
3. stop new protocol admission and capture read-only evidence
4. choose a reviewed code rollback commit only if necessary

Database restore is a last-resort incident action, not a protocol rollback.

Server infrastructure must ship feature OFF before the native protocol build
is enrolled. The native build must support protocol v1 and secure-store
readiness before its account becomes eligible. Old/native-ineligible/browser
clients remain legacy. Do not enable a cohort until both server and native
versions are confirmed.

## Exact execution checklist for a later approval

- [ ] Separate explicit approval for Stage 0 only
- [ ] Read-only proof of deployed SHA, Preview behavior, and environment scope
- [ ] Read-only proof of Production schema/migration state and zero cohort
- [ ] Approved database fingerprint, snapshot, and migration allowlist
- [ ] Separate approval for the controlled migration
- [ ] Post-migration zero-row and unique-index verification
- [ ] Reviewed slim release artifact; Preview excluded; flag still OFF
- [ ] Dedicated internal/test account approved; no email change during cohort
- [ ] Separate approval for exactly one rollout row and global gate
- [ ] Native readiness and account-scoped capability verified
- [ ] One normal Journal save audited for Entry/charge/JSO/intent equality
- [ ] Observation window completed with no stop criterion

No checklist item authorizes the next item automatically.

## General rollout blocker

Durable exact-payload recovery remains unresolved for general/public rollout.
The v1 behavior after restart plus `not_found` remains
`recovery_required`, never an automatic replay. AI-6 limited one-account
planning does not change this blocker.
