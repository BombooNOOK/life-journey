export interface GenerateSecretOptions {
  byteLength?: number;
}

export interface GenerateSecretResult {
  secret: string;
  byteLength: number;
  encoding: string;
  randomSource: string;
}

export interface SetSecretOptions {
  account: string;
  secret: string;
}

export interface SetSecretResult {
  stored: boolean;
  accessibility: string;
  byteLength: number;
}

export interface AccountOptions {
  account: string;
}

export interface GetSecretResult {
  found: boolean;
  secret?: string;
  byteLength?: number;
  accessibility?: string | null;
}

export interface ExistsSecretResult {
  exists: boolean;
  accessibility?: string | null;
}

export interface DeleteSecretResult {
  deleted: boolean;
}

export type TriStateBool = boolean | "unset" | "api_unavailable";

export interface PathAttributes {
  path: string;
  exists: boolean;
  isDirectory?: boolean;
  isExcludedFromBackup: TriStateBool;
  fileProtection: string;
  error?: string;
  parent?: {
    path: string;
    exists: boolean;
    isExcludedFromBackup: TriStateBool;
    fileProtection: string;
  };
}

export interface PathOptions {
  path: string;
}

export interface CandidatePathsResult {
  candidateA_libraryCapacitorDatabase: string;
  candidateB_documents: string;
  candidateC_applicationSupportLjd: string;
  mediaLibraryLjdSecurityPoc: string;
}

export interface LjdLocalSecurityPlugin {
  generateSecret(options?: GenerateSecretOptions): Promise<GenerateSecretResult>;
  setSecret(options: SetSecretOptions): Promise<SetSecretResult>;
  getSecret(options: AccountOptions): Promise<GetSecretResult>;
  existsSecret(options: AccountOptions): Promise<ExistsSecretResult>;
  deleteSecret(options: AccountOptions): Promise<DeleteSecretResult>;
  inspectPath(options: PathOptions): Promise<PathAttributes>;
  setCompleteProtection(options: PathOptions): Promise<PathAttributes>;
  resolveCandidatePaths(): Promise<CandidatePathsResult>;
  ensureProbeFile(options: PathOptions): Promise<PathAttributes>;
  deletePath(options: PathOptions): Promise<{ deleted: boolean; path: string }>;
}
