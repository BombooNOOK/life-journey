/**
 * Redact secret-like values before any diagnostics / error string.
 * Never treat this as cryptography.
 */

const SECRET_KEY =
  /passphrase|password|secret|encryptionkey|encryption_secret|unlocksecret/i;

export function redactSecretLike(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 8 && /^[A-Za-z0-9+/=_-]{16,}$/.test(value)) {
      return "[redacted]";
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(redactSecretLike);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SECRET_KEY.test(key) ? "[redacted]" : redactSecretLike(v);
    }
    return out;
  }
  return value;
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (SECRET_KEY.test(msg)) return `${error.name}: [redacted security error]`;
    return msg;
  }
  return String(redactSecretLike(error));
}

export function assertNoSecretInText(text: string): void {
  if (SECRET_KEY.test(text) && /:\s*['"]?[A-Za-z0-9+/=_-]{12,}/.test(text)) {
    throw new Error("refusing to log secret-like payload");
  }
}
