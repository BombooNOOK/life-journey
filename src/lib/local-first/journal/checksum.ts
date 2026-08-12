/**
 * SHA-256 helpers for Local Journal integrity checks.
 * Not cryptographic authenticity. Never log the input payload.
 */

export async function sha256HexOfBytes(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256HexOfUtf8(text: string): Promise<string> {
  return sha256HexOfBytes(new TextEncoder().encode(text));
}

export async function sha256HexOfBase64(base64Data: string): Promise<string> {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return sha256HexOfBytes(bytes);
}
