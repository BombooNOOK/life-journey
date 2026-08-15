/**
 * Client-safe re-exports only. Server seed helpers are not exported here so
 * browser bundles never pull Prisma / node:crypto.
 */
export {
  evaluateLocalE2eHarnessGate,
  LJD_ENABLE_LOCAL_E2E_HARNESS,
  LJD_LOCAL_E2E_ACTOR_EMAIL,
  resolveLocalE2eActorEmail,
  requestHostFromHeaders,
  isLocalLoopbackHost,
} from "@/lib/localE2eHarness/gate";
export {
  armLocalE2eFault,
  clearLocalE2eFaultsForTest,
  consumeLocalE2eFault,
  listArmedLocalE2eFaults,
  peekLocalE2eFault,
  type LocalE2eFaultMode,
} from "@/lib/localE2eHarness/faultStore";
export { wrapJournalCreateDepsWithLocalE2eFaults } from "@/lib/localE2eHarness/transportAdapters";
export { wrapIntentStoreWithNativeCleanupFault } from "@/lib/localE2eHarness/nativeCleanupAdapter";
export {
  activateLocalE2eClientSessionViaBridge,
  clearLocalE2eClientSession,
  getLocalE2eClientSession,
  setLocalE2eClientSessionForTest,
  subscribeLocalE2eClientSession,
} from "@/lib/localE2eHarness/clientSession";
