# Hybrid Phase 4B-4AI｜Limited Rollout Protocol — Capability & Same-Operation Lookup Design

**Status:** Design / local code audit only  
**Prior:** 4B-4AH local candidate `307a448` (Production deploy = B; limited-rollout design = A)  
**Forbidden this Phase:** Production deploy / env change / DB write / POST / feature ON / rollout account setup / main push / Preview / migration / email-change / background auto-retry

---

## 0. Audit anchors (current code)

| Fact | Location |
| --- | --- |
| Global gate | `LJD_JOURNAL_SAVE_IDEMPOTENCY_ENABLED` via `isJournalSaveIdempotencyEnabled()` |
| Actor SoT | cookie `lj_user_email` → `normalizeEmail` / `getViewerEmailFromCookie` |
| JSO unique key | `(actorKey, saveOperationId)` |
| Domain lookup | `getJournalSaveOperationResult` (no HTTP route yet) |
| Fingerprint | `requestFingerprint` on JSO; production builder hashes content+meta (no raw body/photo) |
| AccountSettings | `email` unique; `isAdmin` / `isMonitor` exist — **not** JSO rollout |
| Account delete | always deletes JSO by `actorKey`; deletes `AccountSettings` |
| Client candidate | `src/lib/journal/clientSaveIntent/*` — native SQLCipher; capability OFF → legacy |
| Create UIs | `journal/page.tsx` + `CompanionWritingPage` both POST create |

---

## 1. Limited rollout principles

1. Never put all users on JSO at once.
2. Eligibility is decided only by a **Server authenticated account-scoped capability**.
3. Client build flags (`NEXT_PUBLIC_*`) are **not** the enable authority.
4. Client must not self-select from an email string allowlist.
5. Server derives actor from cookie identity only; client never POSTs `actorKey`.

---

## 2. Capability endpoint contract

**Route (first choice):** `GET /api/journal/save-capability`  
(aligned with existing `/api/journal/*` read routes; `Cache-Control: private, no-store`)

**Auth:** cookie session required. No body. No client-supplied email/actorKey.

**Server algorithm:**

1. `viewer = getViewerEmailFromCookie()` → if missing → `401`
2. `actorKey = normalizeEmail(viewer)`
3. `globalOn = isJournalSaveIdempotencyEnabled()`
4. `eligible = globalOn && isAccountEligibleForJournalSaveIdempotency(actorKey)`
5. Return minimal JSON (no allowlist contents, no rollout rationale)

**Response (protocol v1):**

```json
{
  "protocolVersion": 1,
  "idempotentSaveEnabled": false,
  "lookupSupported": false,
  "foregroundRecoverySupported": false,
  "automaticBackgroundRetry": false
}
```

| Field | Rule |
| --- | --- |
| `protocolVersion` | integer; client unknown → fail-safe legacy |
| `idempotentSaveEnabled` | true only if global gate ON **and** account eligible |
| `lookupSupported` | true only when same-op lookup route is live **and** `idempotentSaveEnabled` |
| `foregroundRecoverySupported` | true only if `lookupSupported` (recovery requires lookup) |
| `automaticBackgroundRetry` | **always false** in v1 |

When global ON + eligible: all three capability booleans may be true together. When global OFF or non-eligible: all false except `protocolVersion` / `automaticBackgroundRetry:false`.

---

## 3. Account eligibility — first candidate

### Comparison

| Option | Schema | Email-change | Rollback | Accidental all-user | Account delete | Audit | Stable-id future |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **A. Env/code allowlist** | none | brittle (emails in config) | easy | high if wildcard | n/a | poor | poor |
| **B. AccountSettings column** | alter | remap with email row | flip false | medium | already deleted | medium | coupled to billing table |
| **C. Dedicated rollout table** | new table | remap/revoke by actorKey; later add stable key | revoke row | **lowest** (empty = nobody) | delete by actorKey | **best** | **best** |
| D. Reuse `isMonitor` | none | monitor≠rollout | flip monitor | high (wrong cohort) | ok | poor | wrong semantics |

### Decision — first candidate = **C. dedicated rollout table**

Conceptual model (not migrated this Phase):

```text
JournalSaveIdempotencyRollout
  actorKey        String  @unique   // today: normalizeEmail
  enabled         Boolean @default(true)
  enabledAt       DateTime
  revokedAt       DateTime?
  // future: forestResidentNumber String? @unique
```

**Enable rule:**

`eligible ⇔ global gate ON ∧ exists enabled, non-revoked rollout row for actorKey`

Empty table ⇒ nobody eligible even if global ON.  
Global OFF ⇒ capability false for everyone (rows ignored).

**Email-change Gate (OPEN):** eligibility is email-keyed today. Changing email without remap leaves old row orphaned and new identity non-eligible (fail-safe). Do **not** ship email-change until remap Gate closes; prefer later binding to `forestResidentNumber`.

**Interim for local AI-1 tests only:** an in-process / disposable allowlist port may implement the same interface before the Prisma table ships — Production must not use env-wide user lists as the long-term SoT.

---

## 4. Default fail-safe → always legacy

Treat as **not** eligible for idempotent protocol (no intent prepare, no `saveOperationId` on POST):

| Condition |
| --- |
| capability endpoint unreachable / timeout / non-JSON |
| unauthorized / no cookie |
| malformed response |
| unknown / unsupported `protocolVersion` |
| native secure intent store unavailable |
| client actor snapshot ≠ server session email (after session sync) |
| global gate OFF (`idempotentSaveEnabled=false`) |
| account not eligible |
| browser / non-native runtime (initial policy) |

Forbidden: “capability unclear → assume idempotent save.”

---

## 5. Same-operation lookup endpoint contract

**Route (first choice):** `GET /api/journal/save-operations/[saveOperationId]`

**Auth:** cookie only. Path param = client `saveOperationId` (same 16–64 `[0-9A-Za-z_-]+` contract). Invalid id → `400`.

**Server:**

1. Resolve `actorKey` from cookie (never from client).
2. Load JSO by `(actorKey, saveOperationId)` only.
3. Missing / other-actor → indistinguishable **`not_found`** (no existence leak).

Optional query for verification (required for recovery use):

`?requestFingerprint=<clientIntentFingerprint>`

---

## 6. Lookup response contract (minimal)

Do **not** return: raw body, photo, secrets, `actorKey`, stored fingerprint string, internal allowlist.

| Status | HTTP | Body (v1) | Checkpoint public? |
| --- | --- | --- | --- |
| `not_found` | 200 | `{ protocolVersion, status:"not_found" }` | n/a |
| `processing` | 200 | `{ protocolVersion, status:"processing" }` | **No** — client only needs “not terminal” |
| `completed` | 200 | `{ protocolVersion, status:"completed", entryId }` | No |
| `failed_final` | 200 | `{ protocolVersion, status:"failed_final", errorCategory }` | No |
| `fingerprint_mismatch` | 200 | `{ protocolVersion, status:"fingerprint_mismatch" }` | No |
| unauthenticated | 401 | generic | — |

`errorCategory` allowlist only: `ACORN_INSUFFICIENT` | `FAILED_FINAL` (map from `resultCode`; never raw internals).

**Checkpoint:** domain already exposes checkpoint in `getJournalSaveOperationResult` for processing; **HTTP v1 does not publish it**. Foreground UI can retry lookup later; POST resume still works when capability allows same-id POST.

Unauthenticated and cross-actor both must not reveal whether an id exists for another user.

---

## 7. Fingerprint validation

**Decision:** reuse existing JSO `requestFingerprint`.

1. Client intent stores the same production fingerprint bytes used for POST.
2. Lookup **requires** `requestFingerprint` query (or future header) for recovery paths.
3. Server compares to stored JSO fingerprint (constant-time string equality as today).
4. Mismatch → `fingerprint_mismatch` → client `recovery_required` → **automatic POST forbidden** → user-visible safe path (do not invent new opId for the same logical save).

If fingerprint omitted on lookup: return `400` for authenticated recovery callers (forces verification). (Health-only existence probes are out of scope.)

---

## 8. Foreground recovery state machine

```text
awaiting_result | prepared (after crash mid-flight)
  → GET save-capability
  → if not (idempotentSaveEnabled ∧ lookupSupported ∧ native store ready) → stop unsafe recovery; legacy UX only
  → GET save-operations/{id}?requestFingerprint=…
      completed     → bind entryId → intent completed → normal success transition
      processing    → keep same opId; wait / later re-lookup; no new POST required
      failed_final  → intent failed_final; no POST
      fingerprint_mismatch → recovery_required; no POST
      not_found     → re-check capability; if still enabled AND original payload still available in memory
                     → same saveOperationId POST only
                     → else recovery_required (no empty POST, no new opId)
```

**Background automatic POST: forbidden.**

---

## 9. Transport ambiguity (formal philosophy)

| Ambiguity | How resolved |
| --- | --- |
| Request never reached Server | lookup `not_found` (+ payload still held) → same-id POST |
| Server still processing | lookup `processing` → wait / re-lookup; do not mint new id |
| Server completed, response lost | lookup `completed` + `entryId` → complete intent; **no** second charge |

Blind retry without lookup is not the primary recovery path once lookup is live.

---

## 10. Native intent bootstrap (Production formal)

Reuse 4B-4AH / 4B-4O stack:

- Independent DB name: `ljd_client_save_operation_intent`
- Application Support location
- Plugin Keychain encryption secret (`mode:"secret"`)
- `NSFileProtectionComplete` + backup exclude
- **No** browser encrypted fallback; **no** silent plaintext fallback

**Policy when capability ON but secure store not ready:**

→ treat as protocol-ineligible for this session → **legacy POST** (save still works; no `saveOperationId`).  
Do not block the user from saving solely because rollout storage failed to open.

Bootstrap hook (future AI-2): ensure encryption secret once before first open; never on generic web boot.

---

## 11. Account-delete native teardown

**Formal order:**

1. Client: list recoverable intents (optional user notice if `awaiting_result`)
2. Client: `deleteByActor(actorKey)` on intent store (best-effort)
3. Server: existing account delete TX (includes JSO + AccountSettings + …)
4. Client: remaining secure-store teardown / close

| Partial failure | Handling |
| --- | --- |
| Local cleanup fails, server succeeds | Orphan **metadata-only** intent rows possible; scrub on next authenticated launch / logout |
| Local succeeds, server fails | User retries delete; missing local intents are acceptable |
| Server succeeds, rollout row remains | Delete rollout row in same server TX or by actorKey cleanup job — **blocker before rollout** to add |

Treat native teardown wiring as a **Production rollout blocker**.

---

## 12. Common orchestrator (journal + Companion)

Mandatory single application service for create saves:

`runClientJournalCreateSave` / `recoverClientJournalCreateSave`

Both `journal/page.tsx` and `CompanionWritingPage` call only thin adapters (payload + navigation).  
UI components must not manipulate intent lifecycle directly.  
Limited rollout must not enable one entry point without the other.

---

## 13. Legacy / browser coexistence

| Client | Behavior on same Production server |
| --- | --- |
| Non-eligible / capability false | legacy POST (no id) |
| Eligible + native secure ready | intent → `saveOperationId` → JSO path (when global ON) |
| Eligible + browser / web | **initial: legacy** (no browser durable intent) |
| Old clients | unchanged legacy |

Server remains dual-path: missing id → legacy; valid id + flag ON → JSO.

---

## 14. Protocol versioning

- Capability + lookup responses carry `protocolVersion: 1`.
- Client supports a fixed allowlist (start: `{1}`).
- Unknown version → fail-safe legacy.
- Additive fields may appear later; unknown fields ignored. Breaking changes bump version.

---

## 15. First Production rollout cohort (design only — not configured)

- **Internal/test account: 1** (or company device account)
- Explicit insert into rollout table (or revoke) per change
- **No general users**
- This Phase does **not** set any account/email

---

## 16. Tests matrix (local/disposable; Production forbidden)

| # | Case |
| --- | --- |
| 1 | global OFF → capability false |
| 2 | global ON + non-eligible → false |
| 3 | global ON + eligible → true (+ lookup flags) |
| 4 | unauthenticated → 401 / client legacy |
| 5 | unknown protocolVersion → client legacy |
| 6 | lookup other actor → `not_found` |
| 7 | lookup `not_found` / `processing` / `completed` / `failed_final` |
| 8 | fingerprint mismatch → no auto POST |
| 9 | response loss → lookup completed → bind entryId |
| 10 | `not_found` + payload held → same opId POST only |
| 11 | `processing` → no new opId POST |
| 12 | secure intent unavailable → do not start unsafe protocol |
| 13 | browser → legacy |
| 14 | account deletion + pending intent teardown |
| 15 | journal + Companion both use common orchestrator |

---

## 17. Implementation phase split

| Phase | Scope |
| --- | --- |
| **AI-1** | Server contracts: capability + lookup routes, eligibility port (+ dedicated table migration when approved), domain wiring, tests 1–8 |
| **AI-2** | Native secure bootstrap formal connection (secret ensure, open gate, no web fallback) |
| **AI-3** | Client common orchestrator + thin adapters for journal + Companion; capability client; fingerprint parity |
| **AI-4** | Account-delete native teardown + rollout-row cleanup in delete TX |
| **AI-5** | Local end-to-end (intent → POST → loss → lookup → complete) on disposable/native harness |
| **AI-6** | Limited Production rollout **plan** only (cohort=1, runbook, rollback); execute only under later explicit approval |

Optional reorder: AI-2 may start in parallel with AI-1 after contracts freeze; AI-4 must complete before AI-6 execute.

---

## 18. Production rollout blockers

1. HTTP capability + lookup not implemented
2. Dedicated eligibility table (or approved SoT) not migrated / empty-by-default
3. Native secure bootstrap not formally connected
4. Common orchestrator not wired to **both** create UIs
5. Account-delete local teardown + rollout-row cleanup incomplete
6. Email-change Gate still OPEN (email-keyed eligibility)
7. No attempt-scoped durable draft for payload-less `not_found` (acceptable if recovery_required UX exists)
8. Global feature still OFF until explicit enable + cohort row
9. Local E2E (AI-5) not PASS
10. Explicit Production execute approval for AI-6

---

## 19. Verdict

| Question | Answer |
| --- | --- |
| AI-1 implementation ready to start? | **A** — contracts and eligibility first candidate are fixed; implement locally only |
| Production enable / cohort setup now? | **No** |
| Deploy / env / DB write this Phase? | **No** |

## AI-1 implementation record (local only)

- Added `GET /api/journal/save-capability` and
  `GET /api/journal/save-operations/[saveOperationId]`.
- Added empty-by-default `JournalSaveIdempotencyRollout` Prisma model and
  additive migration candidate `20260814231500_add_journal_save_idempotency_rollout`.
- Capability is global safety gate **AND** enabled compatible rollout row; DB
  failure returns disabled capability.
- Lookup is actor-cookie scoped and remains readable after rollout/global
  disable for safe recovery of an existing owner operation. It does not admit
  new operations.
- Account deletion now removes the actor's rollout row in its existing DB
  transaction.
- No rollout write route, rollout row, migration execution, Production access,
  or feature enable was performed.

## AI-1.1 finalization record

- Unauthenticated capability and lookup responses use the existing Journal
  `401` + `AUTH_REQUIRED` contract; tests assert the response contains neither
  actor nor email.
- Route/protocol/account-delete source audit tests, Prisma generate, TypeScript,
  and Next build pass locally.
- Migration SQL static audit passes: one additive table and unique index only;
  no `DROP`, `ALTER`, or unrelated table change.
- Local disposable PostgreSQL integration is **HOLD**: Docker Desktop's daemon
  did not become reachable (bounded `docker info` probes timed out), so the
  migration and real-DB capability/lookup/account-delete cases were not run.
  No fallback database, Neon, Production, or remote connection was used.
- Consequently AI-1 cannot be marked PASS until the specified local disposable
  DB suite runs successfully.
