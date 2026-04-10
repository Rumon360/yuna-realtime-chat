# End-to-End Encryption Design

**Date:** 2026-04-10  
**Scope:** Add true E2E text encryption so the server (Redis, API, Realtime) never sees plaintext messages.

---

## 1. Security Model

- **Trust boundary:** The server is untrusted. Even with full Redis access, an attacker sees only ciphertext.
- **Key transport:** The 256-bit AES-GCM key is embedded in the room URL as a hash fragment (`#k={base64url_key}`). Fragments are never sent to the server by browsers (HTTP spec). Sharing the room link = sharing the key.
- **Algorithm:** AES-GCM, 256-bit key, 96-bit random IV per message. Provides authenticated encryption — tampering is detectable.
- **No external dependencies:** Uses the Web Crypto API (`window.crypto.subtle`) built into all modern browsers. No npm packages added.

---

## 2. New File: `src/lib/crypto.ts`

Four pure async functions. No state. No side effects.

### `generateKey(): Promise<{ key: CryptoKey; encoded: string }>`

Generates a non-extractable-by-default... actually extractable AES-GCM key (must be exportable to embed in URL), exports it as raw bytes, base64url-encodes it.

```ts
export async function generateKey(): Promise<{ key: CryptoKey; encoded: string }> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable so we can export it
    ["encrypt", "decrypt"]
  )
  const raw = await crypto.subtle.exportKey("raw", key)
  const encoded = base64urlEncode(new Uint8Array(raw))
  return { key, encoded }
}
```

### `importKey(encoded: string): Promise<CryptoKey>`

Decodes the base64url string and imports a `CryptoKey`.

```ts
export async function importKey(encoded: string): Promise<CryptoKey> {
  const raw = base64urlDecode(encoded)
  return crypto.subtle.importKey(
    "raw", raw,
    { name: "AES-GCM", length: 256 },
    false, // not extractable after import
    ["encrypt", "decrypt"]
  )
}
```

### `encryptMessage(key: CryptoKey, plaintext: string): Promise<string>`

Generates a random 96-bit IV per message. Returns `"{iv_b64url}:{ciphertext_b64url}"`.

```ts
export async function encryptMessage(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
  return `${base64urlEncode(iv)}:${base64urlEncode(new Uint8Array(ciphertext))}`
}
```

### `decryptMessage(key: CryptoKey, ciphertext: string): Promise<string>`

Splits on `:`, decodes IV + ciphertext, decrypts. Throws on failure (wrong key, tampered data).

```ts
export async function decryptMessage(key: CryptoKey, ciphertext: string): Promise<string> {
  const [ivB64, ctB64] = ciphertext.split(":")
  const iv = base64urlDecode(ivB64)
  const ct = base64urlDecode(ctB64)
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct)
  return new TextDecoder().decode(plaintext)
}
```

### Internal helpers (not exported)

- `base64urlEncode(bytes: Uint8Array): string` — converts bytes to base64url (no padding, URL-safe).
- `base64urlDecode(str: string): Uint8Array` — inverse.

---

## 3. Key Lifecycle

### Room Creation (`src/app/page.tsx`)

After `POST /room/create` succeeds:
1. Call `generateKey()` to get `{ key, encoded }`.
2. Navigate to `/room/${roomId}#k=${encoded}` instead of `/room/${roomId}`.

The key is never sent to the server. It exists only in the browser and in the URL fragment.

### Room Entry (`src/app/room/[roomId]/page.tsx`)

On component mount:
1. Read `window.location.hash` and parse the `k=` parameter.
2. If missing or malformed: set `keyError = true` state — render *"Missing encryption key — use the full room link."* Do not load messages.
3. If present: call `importKey(encodedKey)`, store the resulting `CryptoKey` in a `useRef`. Track readiness with a `keyReady` boolean state so the component can gate rendering until the async import resolves. Key is stable for the room's lifetime — no further re-imports needed.

### Link Sharing

The existing "copy" button copies `window.location.href`, which includes the `#k=...` fragment. No changes needed.

---

## 4. Message Encrypt/Decrypt Flow

### Sending

In `handleSend()`, before calling `client.messages.post(...)`:
```
encryptedText = await encryptMessage(cryptoKeyRef.current, input)
sendMessage({ text: encryptedText })
```

The API receives `text: "{iv}:{ciphertext}"`. Redis stores ciphertext only.

### Receiving (history)

`GET /messages` returns messages with encrypted `text`. Before rendering, map:
```
decryptedText = await decryptMessage(cryptoKeyRef.current, msg.text)
```

If decryption throws (malformed or tampered), display `"[encrypted message]"` as a fallback.

### Receiving (realtime)

The `chat.message` realtime event triggers `refetch()`, which re-runs the history fetch. Decryption happens in the same history-fetch path — no separate realtime decrypt path needed.

---

## 5. Server-Side Change

**File:** `src/app/api/[[...slugs]]/route.ts`

The `text` field Zod schema currently enforces `max(1000)`. AES-GCM + base64 encoding expands a 1000-char plaintext to ~1400 chars of ciphertext. Increase the limit:

```ts
body: z.object({
  sender: z.string().max(100),
  text: z.string().max(5000), // was 1000 — accounts for encryption overhead
}),
```

---

## 6. Files Modified / Created

| File | Change |
|------|--------|
| `src/lib/crypto.ts` | **Create** — all crypto primitives |
| `src/app/page.tsx` | Generate key after room creation, append to nav URL |
| `src/app/room/[roomId]/page.tsx` | Import key from fragment, encrypt on send, decrypt on receive |
| `src/app/api/[[...slugs]]/route.ts` | Increase `text` max from 1000 → 5000 |

---

## 7. Out of Scope

- Key rotation (room has a single key for its 10-minute lifetime)
- Forward secrecy (not needed for ephemeral rooms)
- Verification of sender identity (anonymous by design)
- Displaying the encryption key to users
- Node.js / server-side crypto (all crypto is client-only)
