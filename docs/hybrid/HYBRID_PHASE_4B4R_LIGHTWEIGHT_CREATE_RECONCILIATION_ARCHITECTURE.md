# Hybrid Phase 4B-4R｜Lightweight Create Reconciliation Architecture

**Status:** Pre-Implementation / Architecture review PASS（docs only）  
**Branch:** `docs/lightweight-create-reconciliation`  
**Base:** `feat/internal-save-operation-e2e-poc` @ `4e35eea41f4e1168c068b78fb01721672675d216`  
**Date:** 2026-08-13  

**Parent SoT:** [ljd-lightweight-create-reconciliation-spec.md](../product/ljd-lightweight-create-reconciliation-spec.md)

**Cross-links:**
- [HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md](./HYBRID_PHASE_4B4M_SERVER_SUCCESS_OUTBOX_GAP_ARCHITECTURE.md)
- [HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md](./HYBRID_PHASE_4B4Q_INTERNAL_SAVE_OPERATION_E2E.md)
- [ljd-save-operation-reconciliation-spec.md](../product/ljd-save-operation-reconciliation-spec.md)
- [ljd-local-mirror-outbox-spec.md](../product/ljd-local-mirror-outbox-spec.md)
- [ljd-local-generation-lifecycle-spec.md](../product/ljd-local-generation-lifecycle-spec.md)
- [ljd-journal-save-idempotency-spec.md](../product/ljd-journal-save-idempotency-spec.md)
- [ljd-local-save-operation-intent-spec.md](../product/ljd-local-save-operation-intent-spec.md)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**Code changes this Phase:** **none**

---

## 1. Purpose

Design Strategy **A** (lightweight Server→Local **create** reconciliation) as an **insurance layer** beside B+C.  
No sync engine, no update/delete, no production API change.

---

## 2. Code audit summary

### Server list (`GET /api/journal`)

- Month/year via **UTC `createdAt`** half-open ranges  
- **No** cursor / updated-since  
- Hard `take` (list month ≈ **200**) — completeness risk  
- Month list fields include `id`, `createdAt`, `updatedAt`, `hasPhoto` (no photo body)  
- Canonical mirror: `GET /api/journal/[id]`

### Local

- Compare key: **`legacyServerId`**  
- **`serverCreatedAt` absent** → R-C rejected  
- **`dateKey` ≠ Server createdAt**  
- `serverUpdatedAt` exists but unused for create detection

---

## 3. Recommended design (candidate A)

| Topic | Candidate |
| --- | --- |
| Scan | **R-B** + current UTC month always rescan + **R-D** manual |
| Checkpoint | Independent small metadata store（not manifest/registry/outbox） |
| Backup | **Include** checkpoint; rewind/reset if newer-than-Local risk |
| Advance | **Local mirror completeness**（all Server ids present as `legacyServerId` + no pending outbox）後のみ。**outbox enqueue だけでは advance しない**（4B-4S 正式化） |
| Missing | Server `id` ∉ Local `legacyServerId` |
| Recovery | Existing outbox enqueue → GET → mirror → ack |
| Generation | New recovery jobs → **current healthy technical_active**（not pending retarget） |
| Timing | Foreground / Journal open bounded / restore — no background |
| Bootstrap | Recent bounded + R-D；never unbounded full scan |
| List cap | `>= take` → scope incomplete；pagination = production Release Blocker 候補 |

**4B-4S:** [HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md](./HYBRID_PHASE_4B4S_INTERNAL_LIGHTWEIGHT_CREATE_RECONCILIATION_POC.md)

---

## 4. B+C vs A

| | B+C | Lightweight A |
| --- | --- | --- |
| Path | saveOperationId + intent + idempotent POST | Server list scan |
| Closes | Window B/C when metadata present | Metadata loss / old clients / restore |
| 4B-4Q internal | Gap criteria PASS | Not required for that PASS |
| Production blocker | Still open（wiring/migration） | Insurance only — **not** sole closer |

---

## 5. SERVER_SUCCESS_TO_OUTBOX_GAP status

| Environment | Status |
| --- | --- |
| Internal B+C (4B-4Q) | Closed by criteria |
| Production | **Not closed** — POST wiring / official migration / intent / lookup pending |
| This Phase A | Does **not** flip production to closed |

---

## 6. Official migration / Preview isolation

Unchanged from 4B-4P/Q: Preview DB isolation **Unknown** → `prisma/migrations/` promotion **B**.  
This Phase does not touch migrations.

---

## 7. Next

**4B-4S｜Internal Lightweight Create Reconciliation PoC**  
Disposable local Server DB + fixture Server-only entry → scan → missing → outbox → encrypted Local.  
No Neon / no general あしあと browsing.

---

## 8. Verdicts

| Question | Answer |
| --- | --- |
| Lightweight create reconciliation as insurance A? | **A** |
| Checkpoint design as A? | **A**（independent + backup include + rewind safety） |
| Proceed to 4B-4S internal PoC? | **A** |
| Official migration promotion now? | **B** |
| Production POST wiring now? | **B** |
| main merge? | **No** |

---

## 9. Forbidden confirmation

- No reconciliation implementation  
- No Server API / cursor  
- No update/delete sync / background  
- No Prisma migration / Vercel env / Production deploy  
- Working tree code: **unchanged**（docs only）
