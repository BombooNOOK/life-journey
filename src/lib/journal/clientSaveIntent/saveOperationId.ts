/**
 * Browser-safe opaque operation ID generator matching the server 4B-4Y
 * contract: 16–64 chars of [0-9A-Za-z_-].
 */

const MIN_LENGTH = 16;
const MAX_LENGTH = 64;
const PATTERN = /^[0-9A-Za-z_-]+$/;

export function normalizeClientActorKey(viewerEmail: string): string {
  return viewerEmail.trim().toLowerCase();
}

export function isValidClientSaveOperationId(value: string): boolean {
  return (
    value.length >= MIN_LENGTH &&
    value.length <= MAX_LENGTH &&
    PATTERN.test(value)
  );
}

export function createClientSaveOperationId(random: Crypto = crypto): string {
  const bytes = new Uint8Array(24);
  random.getRandomValues(bytes);
  // URL-safe base64 without padding: exactly 32 contract-safe characters.
  const base64 = btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  const id = `jso_${base64}`;
  if (!isValidClientSaveOperationId(id)) {
    throw new Error("generated_save_operation_id_invalid");
  }
  return id;
}
