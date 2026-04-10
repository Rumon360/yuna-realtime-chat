// base64url: no padding, uses - and _ instead of + and /
function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str + "=".repeat((4 - (str.length % 4)) % 4)
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.length)
}

/**
 * Generate a new 256-bit AES-GCM key.
 * Returns the CryptoKey and its base64url-encoded raw bytes for embedding in a URL fragment.
 */
export async function generateKey(): Promise<{ key: CryptoKey; encoded: string }> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // must be extractable so we can export raw bytes for the URL
    ["encrypt", "decrypt"]
  )
  const raw = await crypto.subtle.exportKey("raw", key)
  const encoded = base64urlEncode(new Uint8Array(raw))
  return { key, encoded }
}

/**
 * Import a 256-bit AES-GCM key from its base64url-encoded raw bytes.
 * Call this on room entry when reading the key from the URL fragment.
 */
export async function importKey(encoded: string): Promise<CryptoKey> {
  const raw = base64urlDecode(encoded)
  return crypto.subtle.importKey(
    "raw",
    raw as BufferSource,
    { name: "AES-GCM", length: 256 },
    false, // not re-exportable after import
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypt a plaintext string.
 * Generates a fresh random 96-bit IV per message.
 * Returns "{iv_b64url}:{ciphertext_b64url}".
 */
export async function encryptMessage(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext: ArrayBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, encoded as BufferSource)
  return `${base64urlEncode(iv)}:${base64urlEncode(new Uint8Array(ciphertext))}`
}

/**
 * Decrypt a ciphertext string produced by encryptMessage.
 * Throws if the data is malformed or the key is wrong (authentication failure).
 */
export async function decryptMessage(key: CryptoKey, ciphertext: string): Promise<string> {
  const colonIdx = ciphertext.indexOf(":")
  if (colonIdx === -1) throw new Error("Invalid ciphertext: missing delimiter")
  const iv = base64urlDecode(ciphertext.slice(0, colonIdx))
  const ct = base64urlDecode(ciphertext.slice(colonIdx + 1))
  const plaintext: ArrayBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource)
  return new TextDecoder().decode(new Uint8Array(plaintext))
}
