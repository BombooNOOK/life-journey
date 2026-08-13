# Hybrid Phase 4B-4O.1｜Preview Build Health Cleanup

**Status:** TypeScript = 0 / `next build` PASS / Hybrid regression PASS  
**Branch:** `fix/hybrid-preview-build-health`  
**Base:** `feat/local-save-operation-intent-poc` @ `68b434cac4f91dc1b4de36f253336706ab16960c`  
**Date:** 2026-08-13  

**Scope:** Restore Web/Next Preview build health for the latest Hybrid chain.  
**Not:** feature semantics change, Production deploy, main merge, Neon/Prisma production migrate, Vercel env changes.

---

## 1. Failure boundary (prior diagnosis)

| Item | Value |
| --- | --- |
| Last Ready Preview | `97d4a0e` |
| First failing Preview | `390eebab44b41fd28f45f719f4c22b46ca61e159` (`feat/local-journal-activation-pointer-poc`) |
| Production | `a160d25743d8` success (untouched this Phase) |

---

## 2. Root error (first)

**File:** `src/lib/local-first/journal/activation/LocalJournalTechnicalActivation.ts`  
**Error:** `Type error: 'manifest' is possibly 'null'.` (line ~225, `interpretResolve`)

**Fix:** Explicit fail-closed guard  
`if (read.status !== "ok" || !read.manifest)` → return `corrupt_manifest`  
No `!` assertion / no `as` cast. Semantics remain fail-closed.

---

## 3. Subsequent errors found on `68b434c` (tsc)

| Error | Cause | Minimal fix |
| --- | --- | --- |
| `CompanionWritingPage.tsx` `data.entry` possibly undefined | optional after optional chain in async callback | Bind `savedEntry` after guard |
| `runLocalMirrorOutboxPoc.ts` `isConnection` object arg | CapacitorSQLite plugin typing expects positional via `SQLiteConnection` | Match existing codebase call style |
| `runGenerationRegistryPoc.ts` `registryRow` on union | `RegistryAwareResolveOutcome` ok branch may omit `registryRow` | `'registryRow' in resolved` narrow |
| `saveMirrorRoutingPreconditions.ts` `ensurePluginEncryptionSecret()` 0 args | API requires passphrase; probe-only intent | `isPluginEncryptionSecretStored()` (+ export) |
| same file `registryRow` | same union | guard `registryRow in resolved` |

---

## 4. ESLint Errors blocking `next build` after TS PASS

| Error | Fix |
| --- | --- |
| `prefer-const` in outbox test counters | `let` → `const` (never reassigned) |
| `prefer-const` `store` in registry resolve | `let` → `const` |
| `prefer-const` `intent` in saveIntent service | `let` → `const` |

---

## 5. Build results (local, safe)

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS (0 errors)** |
| `prisma generate && next build` (**no** `migrate deploy`) | **PASS** — Compiled successfully; static generation completed |
| Native-only exclude from Vercel | **Not done** (not required) |
| Production / Neon / Vercel env | **Unchanged** |

Note: full `npm run build:vercel` includes `prisma migrate deploy` — not run here (would touch DB). Compile/type health is restored independently.

---

## 6. Regression

vitest suites (activation / generation / registry / outbox / save mirror / idempotency / save intent):

**7 files / 98 tests PASS**

PoC semantics intentionally unchanged (type/lint narrowing only).

---

## 7. Verdicts

| Question | Answer |
| --- | --- |
| Hybrid Preview build health restored? | **A** (local tsc + next build) |
| Proceed to 4B-4P? | **A** |
| main merge now? | **No** |
| Production deploy? | **No** |
