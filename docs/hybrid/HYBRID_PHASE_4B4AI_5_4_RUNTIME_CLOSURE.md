# 4B-4AI-5.4｜Runtime Recovery Closure

## Status

AI-5 repository closure: **PASS A**  
General/public rollout: **B** (unchanged)  
AI-6: **not started**

## Signed Simulator runtime evidence

The signed iOS Simulator ran against the local-only Next runtime and local
PostgreSQL test database. The actual application UI passed:

- Journal normal save
- Companion normal save
- response loss followed by process termination, relaunch, and lookup completion
- processing presentation with no additional write
- not-found explicit continuation using the original operation
- restart with unavailable volatile payload, resulting in recovery-required
- rollout OFF: legacy fresh save, existing-operation lookup, and rejected continuation
- account deletion happy path
- native cleanup failure followed by relaunch and local-only cleanup retry

Across the cases, each logical successful save produced at most one entry and
one `diary_save` charge. The unrelated local actor remained unchanged.

## Runtime defects found and closed

1. An unresolved new-save result left the story overlay visible, obscuring
   recovery feedback.
2. A stale ambiguous-save error remained after recovery reached a definite
   state.
3. A remount with no recovery results stayed in `checking`; rejected recovery
   work could also leave the same state indefinitely.
4. A `recovery_required` client intent could not accept a later server
   `completed` result discovered by a foreground lookup.

The fixes are deliberately limited to recovery presentation and the client
intent lifecycle.

### Lifecycle boundary

`recovery_required -> server_completed` is permitted only to record a
server-completed fact learned by a later read-only lookup. It does not make a
new write admissible and does not permit terminal-state rewinds:

- `completed -> awaiting_result` remains rejected.
- `failed_final -> awaiting_result` remains rejected.
- `completed` remains self-transition only.

## Regression evidence

- AI-1 through AI-5 related client intent, save-idempotency, account-delete,
  and local-harness Vitest suites: 94 passed, 8 intentionally skipped.
- `tsc --noEmit`: passed.
- `npm run build:vercel`: passed with `migrate=false`.

No production, Neon, migration, deployment, push, or rollout action occurred.
