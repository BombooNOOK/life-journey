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

export interface SetExcludedFromBackupOptions {
  path: string;
  excluded: boolean;
}

export interface ApplicationSupportLjdDirResult {
  applicationSupportRoot: string;
  bundleIdentifier: string;
  ljdApplicationSupportDir: string;
  ljdDatabasesDir: string;
  pluginRelativeLocation: string;
  note?: string;
}

export interface InspectGenericPasswordAccessibilityOptions {
  service: string;
  account: string;
}

export interface InspectGenericPasswordAccessibilityResult {
  found: boolean;
  service: string;
  account: string;
  accessibility: string | null;
  accessibilityRawPresent: boolean;
  verdictHint: "A" | "B" | "C";
  returnedSecretData?: boolean;
  note?: string;
}

export interface VolumeAvailableCapacityResult {
  ok: boolean;
  availableBytes: number | null;
  importantUsageBytes: number | null;
  volumeAvailableCapacity: number | null;
  opportunisticUsageBytes: number | null;
  source: string;
}

export interface SqliteArtifactListing {
  name: string;
  bytes: number;
  role: string;
}

export interface ListSqliteArtifactsResult {
  artifacts: SqliteArtifactListing[];
}

export interface LjdLocalSecurityPlugin {
  inspectPath(options: PathOptions): Promise<PathAttributes>;
  setCompleteProtection(options: PathOptions): Promise<PathAttributes>;
  setExcludedFromBackup(options: SetExcludedFromBackupOptions): Promise<PathAttributes>;
  resolveApplicationSupportLjdDir(): Promise<ApplicationSupportLjdDirResult>;
  inspectGenericPasswordAccessibility(
    options: InspectGenericPasswordAccessibilityOptions,
  ): Promise<InspectGenericPasswordAccessibilityResult>;
  getVolumeAvailableCapacity(): Promise<VolumeAvailableCapacityResult>;
  listSqliteArtifactsInLjdDir(): Promise<ListSqliteArtifactsResult>;
}
