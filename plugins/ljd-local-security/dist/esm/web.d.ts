import { WebPlugin } from '@capacitor/core';
import type { LjdLocalSecurityPlugin } from './definitions';
export declare class LjdLocalSecurityWeb extends WebPlugin implements LjdLocalSecurityPlugin {
    inspectPath(): Promise<import('./definitions').PathAttributes>;
    setCompleteProtection(): Promise<import('./definitions').PathAttributes>;
    setExcludedFromBackup(): Promise<import('./definitions').PathAttributes>;
    resolveApplicationSupportLjdDir(): Promise<import('./definitions').ApplicationSupportLjdDirResult>;
    inspectGenericPasswordAccessibility(): Promise<import('./definitions').InspectGenericPasswordAccessibilityResult>;
}
