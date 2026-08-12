import { WebPlugin } from '@capacitor/core';
export class LjdLocalSecurityWeb extends WebPlugin {
    async inspectPath() {
        throw this.unimplemented('Not implemented on web.');
    }
    async setCompleteProtection() {
        throw this.unimplemented('Not implemented on web.');
    }
    async setExcludedFromBackup() {
        throw this.unimplemented('Not implemented on web.');
    }
    async resolveApplicationSupportLjdDir() {
        throw this.unimplemented('Not implemented on web.');
    }
    async inspectGenericPasswordAccessibility() {
        throw this.unimplemented('Not implemented on web.');
    }
    async getVolumeAvailableCapacity() {
        throw this.unimplemented('Not implemented on web.');
    }
    async listSqliteArtifactsInLjdDir() {
        throw this.unimplemented('Not implemented on web.');
    }
    async deleteAllowlistedSqliteArtifacts() {
        throw this.unimplemented('Not implemented on web.');
    }
}
