export {
  X66B_DEVICE_VALIDATION_AUTORUN_FLAG,
  X66B_DEVICE_VALIDATION_AUTORUN_FLAG_VALUE,
  X66B_EVIDENCE_STORAGE_KEY,
  X66B_VALIDATION_CONTENT,
  X66B_VALIDATION_DRAFT_REF,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/constants";
export {
  evaluateX66bDeviceValidationGate,
  isX66bDeviceValidationPageAllowed,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/gate";
export {
  aliasSaveOperationId,
  appendEvidencePhase,
  assertEvidenceRedacted,
  classifyStableActorKey,
  clearEvidenceStorage,
  emptyX66bEvidence,
  loadEvidenceFromStorage,
  resolveAuthAlias,
  saveEvidenceToStorage,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/evidence";
export type {
  X66bAuthAlias,
  X66bEvidencePhase,
  X66bEvidenceStage,
  X66bStableActorClass,
  X66bValidationEvidence,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/evidence";
export {
  createX66bInstrumentedDeps,
  X66B_CONTROLLED_INTERRUPT_ERROR,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/interruption";
export {
  runX66bCreatePendingAutorun,
  runX66bRecoveryAutorun,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/controller";
export type {
  X66bAutorunResult,
  X66bAutorunState,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/controller";
