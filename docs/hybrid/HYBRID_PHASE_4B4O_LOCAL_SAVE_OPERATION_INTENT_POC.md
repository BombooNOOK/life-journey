# Hybrid Phase 4B-4O｜Durable Local Save Operation Intent PoC

**Status:** Domain + unit PASS; native Simulator I1–I9 **正式 PASS** (FAILS=0)  
**Branch:** `feat/local-save-operation-intent-poc`  
**Base:** `feat/server-journal-save-idempotency-poc` @ `6800db599ff4816b1188e31f2b604d0d1229dfc8`  
**Date:** 2026-08-13  
**Native verification:** Capacitor start URL → `/preview/save-intent-poc` on iPhone 17 Simulator; report `Library/ljd/security-poc/local-save-operation-intent-poc-report.json`  
**Native attrs:** encrypted=true, NSFileProtectionComplete=true, backupExcluded=true, productionOutboxUntouched=true  

**Companions:**
- [ljd-local-save-operation-intent-spec.md](../product/ljd-local-save-operation-intent-spec.md)
- [ljd-journal-save-idempotency-spec.md](../product/ljd-journal-save-idempotency-spec.md) (4B-4N)
- [HYBRID_PHASE_4B4N_SERVER_SAVE_IDEMPOTENCY_POC.md](./HYBRID_PHASE_4B4N_SERVER_SAVE_IDEMPOTENCY_POC.md)
- [ljd-save-operation-reconciliation-spec.md](../product/ljd-save-operation-reconciliation-spec.md) (4B-4M)

**Formal main (do not merge):** `a160d25743d82713b3d218abacd2d26833b0bc9b`  
**RG-1〜4:** unchanged / incomplete  

---

## 1. Goal

Strategy **B** only: durable Local save-operation intent **before** Server POST.  
No production route wiring. Fake Server results via 4B-4N domain.

---

## 2. Actor identity audit

| Finding | Detail |
| --- | --- |
| Journal auth | `lj_user_email` cookie |
| Firebase UID in DB | Not used for ownership |
| PoC actorKey | Normalized viewer email (= 4B-4N userId) |
| Speculative UID switch | **Rejected** |

---

## 3. Storage / security

- DB: `ljd_local_save_operation_intent_poc` (SQLCipher, App Support)
- Keychain: reuse plugin secret
- `NSFileProtectionComplete` + **backup exclude**
- Separate from mirror outbox / `ljd_local_journal`

---

## 4. Draft / payload recovery

**No** attempt-scoped durable draft for content+photo.  
`not_found` → `recovery_required` / `PAYLOAD_UNAVAILABLE`. No empty auto-POST. No body copy into intent DB.

---

## 5. Implementation map

| Path | Role |
| --- | --- |
| `src/lib/local-first/journal/saveIntent/*` | Domain, memory, SQLCipher, PoC runner |
| `/preview/save-intent-poc` | Dev auto-runner I1–I9 |
| Production journal route / Prisma | **Unchanged** |

---

## 6. O1–O6 (unit)

| Case | Result |
| --- | --- |
| O1 intent前 crash | No row |
| O2 intent後 POST前 | prepared persists |
| O3 POST後 response前 | awaiting_result + operationId |
| O4 Server completed / response lost | lookup → bind entryId |
| O5 enqueue前 | mirror candidate; outbox unique safe |
| O6 enqueue後 | intent completed; further recovery = outbox (4B-4I/L) |

---

## 7. Tests

- vitest `LocalSaveOperationIntentService.test.ts` — unit suite  
- Native: `runLocalSaveOperationIntentPoc` I1–I9  

---

## 8. Phase order lock

**Next = 4B-4Q** internal E2E (after 4B-4P nonprod Prisma PASS).  
Still not production POST / Neon migrate / main merge.

---

## 9. Verdicts

| Question | Answer |
| --- | --- |
| Local durable save intent as candidate A? | **A** |
| Window B/C recovery architecture as A? | **A** (structure; payload retry still constrained) |
| Next: non-production Prisma integration? | **A** |
| Production POST wiring now? | **B (no)** |
| main merge? | **No** |

---

## 10. Production unchanged

- No `POST /api/journal` change  
- No Prisma/Neon migrate  
- No production mirror routing / automatic replay / background worker  
- No Local generation / RG changes beyond new PoC DB  
