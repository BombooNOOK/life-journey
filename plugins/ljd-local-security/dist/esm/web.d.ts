import { WebPlugin } from '@capacitor/core';
import type { LjdLocalSecurityPlugin } from './definitions';
export declare class LjdLocalSecurityWeb extends WebPlugin implements LjdLocalSecurityPlugin {
    inspectPath(): Promise<import('./definitions').PathAttributes>;
    setCompleteProtection(): Promise<import('./definitions').PathAttributes>;
    setExcludedFromBackup(): Promise<import('./definitions').PathAttributes>;
    resolveApplicationSupportLjdDir(): Promise<import('./definitions').ApplicationSupportLjdDirResult>;
    inspectGenericPasswordAccessibility(): Promise<import('./definitions').InspectGenericPasswordAccessibilityResult>;
    getVolumeAvailableCapacity(): Promise<import('./definitions').VolumeAvailableCapacityResult>;
    listSqliteArtifactsInLjdDir(): Promise<import('./definitions').ListSqliteArtifactsResult>;
    atomicReplaceTextFile(): Promise<import('./definitions').AtomicReplaceTextFileResult>;
    readTextFile(): Promise<import('./definitions').ReadTextFileResult>;
}
