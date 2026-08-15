# 4B-4AI-5.2｜Local Runtime E2E Harness Foundation

## Scope

Build **only** the local-only harness needed to run actual Journal / Companion
runtime E2E safely. AI-5 full fault matrix is **not** started here (→ AI-5.3).

Forbidden in this phase: Production / Neon / deploy / Production migration /
Vercel env changes / main push / Preview deploy / generic auth bypass /
generic production fault API / Keychain reset / personal or company iPhone.

## Formal AI-5 test path — Simulator → local Next

Signed Debug Simulator connects with:

```bash
CAPACITOR_SERVER_URL=http://127.0.0.1:3000
```

via `scripts/cap-sync.mjs` / `capacitor.config.ts` (env-only `server.url`).

Rules:

- Session / local execution only
- Do **not** commit `server.url` into production iOS config
- Do **not** leave a local URL in committed iOS config
- No Production URL fallback

Before writes, probe Simulator → local Next read-only (`operator-local-e2e-harness-4b4ai52.ts probe-next`).

## Auth audit (A → B → C)

| Option | Result |
|---|---|
| **A** Existing local/emulator auth path | **Not available** (no Auth Emulator wiring in repo) |
| **B** Firebase Auth Emulator | Deferred — would work, but needs emulator infra beyond AI-5.2 minimum |
| **C** Fixed local-E2E actor bridge | **Selected** |

### C bridge

- Actor fixed by env: `LJD_LOCAL_E2E_ACTOR_EMAIL`
- Route: `POST /api/local-e2e/session` — **ignores client email body**
- Cookies reuse the same `lj_logged_in` / `lj_user_email` names as formal session
- Client stub viewer for Journal UI after server-confirmed bridge only

### Auth security gates (all required)

1. `NODE_ENV !== "production"`
2. `LJD_ENABLE_LOCAL_E2E_HARNESS=YES`
3. Request host = `localhost` / `127.0.0.1`
4. `DATABASE_URL` host = loopback, port `5433`, database `ljd_dev`

Otherwise routes/pages return **404** (appear absent).

## Fault harness architecture

Process-memory one-shot faults (`src/lib/localE2eHarness/faultStore.ts`):

| Mode | Layer |
|---|---|
| `response_loss_after_server_success` | Client transport after real POST 200 |
| `lookup_processing_once` | Client lookup adapter |
| `lookup_not_found_once` | Client lookup adapter |
| `native_cleanup_failure_once` | `deleteByActor` wrapper |

Properties: local/dev, explicit arm, one-shot, test-actor scoped, optional
`saveOperationId` scope, auto-clear on consume.

Harness OFF → formal Journal save / capability / lookup / account delete /
browser legacy behavior unchanged (covered by unit tests).

### Response-loss

Server completes JournalEntry / diary path / JSO `completed` for real.
Client adapter then discards the successful Response (throw → orchestrator
transport ambiguity / `processing`). Server TX is never faked.

### Processing / not_found

Lookup adapter returns synthetic `{ state }` once without changing Journal POST.
Then formal lookup resumes.

### Native cleanup failure

Fails the next `deleteByActor` only. Does not corrupt SQLCipher DB files,
Keychain secrets, or schema.

## Control surface

Chosen: **application test adapter** + **dev-only diagnostics panel**
(`/preview/local-e2e-harness`) + **operator CLI**.

No generic production fault-control endpoint.

## Local actor fixture

`seedLocalE2eActorFixture` / `cleanupLocalE2eActorFixture` on
`127.0.0.1:5433/ljd_dev` only:

- AccountSettings, Profile, donguri grant, rollout protocol v1 enabled
- Cleanup is exact-actor scoped

## Local capability

Local Next process env (not committed secrets):

```bash
LJD_JOURNAL_SAVE_IDEMPOTENCY_ENABLED=YES
LJD_ENABLE_LOCAL_E2E_HARNESS=YES
LJD_LOCAL_E2E_ACTOR_EMAIL=local-e2e-actor@ljd.local
DATABASE_URL=postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public
```

Do not touch Production Vercel env.

## Operator commands

```bash
npx tsx scripts/operator-local-e2e-harness-4b4ai52.ts gate
npx tsx scripts/operator-local-e2e-harness-4b4ai52.ts seed
npx tsx scripts/operator-local-e2e-harness-4b4ai52.ts probe-next
npx tsx scripts/operator-local-e2e-harness-4b4ai52.ts cleanup
```

## Next

AI-5.3 — actual runtime fault matrix on signed Simulator against this harness.
