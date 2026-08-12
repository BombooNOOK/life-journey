import { WebPlugin } from '@capacitor/core';
export class LjdLocalSecurityWeb extends WebPlugin {
    async generateSecret() {
        throw this.unimplemented('Not implemented on web.');
    }
    async setSecret() {
        throw this.unimplemented('Not implemented on web.');
    }
    async getSecret() {
        throw this.unimplemented('Not implemented on web.');
    }
    async existsSecret() {
        throw this.unimplemented('Not implemented on web.');
    }
    async deleteSecret() {
        throw this.unimplemented('Not implemented on web.');
    }
    async inspectPath() {
        throw this.unimplemented('Not implemented on web.');
    }
    async setCompleteProtection() {
        throw this.unimplemented('Not implemented on web.');
    }
    async resolveCandidatePaths() {
        throw this.unimplemented('Not implemented on web.');
    }
    async ensureProbeFile() {
        throw this.unimplemented('Not implemented on web.');
    }
    async deletePath() {
        throw this.unimplemented('Not implemented on web.');
    }
    async inspectGenericPasswordAccessibility() {
        throw this.unimplemented('Not implemented on web.');
    }
    async setExcludedFromBackup() {
        throw this.unimplemented('Not implemented on web.');
    }
    async resolveApplicationSupportLjdDir() {
        throw this.unimplemented('Not implemented on web.');
    }
    async armLockAccessProbe() {
        throw this.unimplemented('Not implemented on web.');
    }
    async readLockAccessProbeResult() {
        throw this.unimplemented('Not implemented on web.');
    }
    async disarmLockAccessProbe() {
        throw this.unimplemented('Not implemented on web.');
    }
}
