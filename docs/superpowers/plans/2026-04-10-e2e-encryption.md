# E2E Encryption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encrypt all chat messages client-side before sending so the server (Redis, API, Realtime) never sees plaintext.

**Architecture:** A new `src/lib/crypto.ts` module wraps the Web Crypto API with four pure functions (generateKey, importKey, encryptMessage, decryptMessage). On room creation, a 256-bit AES-GCM key is generated and embedded in the room URL as a hash fragment (`#k=...`). The room page extracts and imports the key on mount, encrypts outgoing messages, and decrypts incoming messages before rendering.

**Tech Stack:** Web Crypto API (`crypto.subtle`, built into all modern browsers), AES-GCM 256-bit, base64url encoding via `btoa`/`atob`, Next.js App Router, React Query, Elysia + Zod

---

## Files

| File | Change |
|------|--------|
| `src/lib/crypto.ts` | **Create** — generateKey, importKey, encryptMessage, decryptMessage + base64url helpers |
| `src/app/page.tsx` | Modify — call generateKey after room creation, navigate with `#k=` fragment |
| `src/app/room/[roomId]/page.tsx` | Modify — import key from fragment, encrypt send, decrypt received messages |
| `src/app/api/[[...slugs]]/route.ts` | Modify — increase `text` max from 1000 → 5000 for encryption overhead |

---

## Task 1: Create `src/lib/crypto.ts`

**Files:**
- Create: `src/lib/crypto.ts`

- [ ] **Step 1: Create the crypto module**

```ts
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
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
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
    raw,
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
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
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
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct)
  return new TextDecoder().decode(plaintext)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/crypto.ts
git commit -m "feat: add AES-GCM crypto module for E2E message encryption"
```

---

## Task 2: Update API — increase text size limit

**Files:**
- Modify: `src/app/api/[[...slugs]]/route.ts`

- [ ] **Step 1: Increase the `text` field max in the messages POST body schema**

Find the `body` schema in the `messages` Elysia plugin (around line 85) and change `max(1000)` to `max(5000)`:

```ts
body: z.object({
  sender: z.string().max(100),
  text: z.string().max(5000), // was 1000 — AES-GCM + base64 adds ~40% overhead
}),
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/api/[[...slugs]]/route.ts"
git commit -m "feat: increase message text limit to 5000 for encryption overhead"
```

---

## Task 3: Update Lobby — generate key on room creation

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace `page.tsx` with the version that generates a key after room creation**

```tsx
"use client"

import useUsername from "@/hooks/use-username"
import { client } from "@/lib/client"
import { generateKey } from "@/lib/crypto"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { toast } from "sonner"

function NotificationBanner({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="w-full max-w-[420px] mb-6 border border-linear-danger/20 rounded-xl px-[18px] py-[14px] bg-linear-danger/5 text-center">
      <p className="text-[11px] font-[510] tracking-[0.12em] uppercase text-linear-danger mb-1">
        {title}
      </p>
      <p className="text-sm text-linear-muted leading-relaxed">{message}</p>
    </div>
  )
}

function Lobby() {
  const router = useRouter()
  const { username } = useUsername()
  const searchParams = useSearchParams()

  const wasDestroyed = searchParams.get("destroyed") === "true"
  const error = searchParams.get("error")

  const { mutate: createRoom, isPending: isCreateRoomPending } = useMutation({
    mutationFn: async () => {
      toast.loading("Creating room...", { id: "create-room" })
      const res = await client.room.create.post()
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: async (data) => {
      toast.success("Room created!", { id: "create-room" })
      if (data?.roomId) {
        const { encoded } = await generateKey()
        router.push(`/room/${data.roomId}#k=${encoded}`)
      }
    },
    onError: () => {
      toast.error("Failed to create room", { id: "create-room" })
    },
  })

  return (
    <main className="min-h-svh bg-linear-bg flex flex-col items-center justify-center px-6 py-14">
      {wasDestroyed && (
        <NotificationBanner
          title="Room Destroyed"
          message="All messages were permanently deleted."
        />
      )}
      {error === "room-not-found" && (
        <NotificationBanner
          title="Room Not Found"
          message="This room may have expired or never existed."
        />
      )}
      {error === "room-full" && (
        <NotificationBanner
          title="Room Full"
          message="This room is at maximum capacity."
        />
      )}

      <div className="w-full max-w-[420px] border border-linear-border rounded-2xl p-8">
        <p className="text-[11px] font-[510] tracking-[0.12em] uppercase text-linear-subtle mb-2.5">
          Your Anonymous Identity
        </p>

        <div className="bg-linear-hover border border-linear-border rounded-xl px-4 py-3 text-base font-[510] text-linear-text tracking-tight mb-5">
          {username}
        </div>

        <button
          disabled={isCreateRoomPending}
          onClick={() => createRoom()}
          className="w-full h-14 rounded-full bg-linear-brand text-white text-base font-[510] tracking-wide hover:bg-linear-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isCreateRoomPending ? "creating…" : "create secure room"}
        </button>

        <p className="text-center mt-4 text-[13px] text-linear-muted leading-relaxed">
          Rooms self-destruct after 10 minutes
        </p>
      </div>
    </main>
  )
}

const Page = () => {
  return (
    <Suspense>
      <Lobby />
    </Suspense>
  )
}

export default Page
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: generate E2E key on room creation, embed in URL fragment"
```

---

## Task 4: Update ChatRoom — import key, encrypt send, decrypt receive

**Files:**
- Modify: `src/app/room/[roomId]/page.tsx`

- [ ] **Step 1: Replace the ChatRoom page with the E2E-enabled version**

```tsx
"use client"

import { Bomb, Send } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { client } from "@/lib/client"
import useUsername from "@/hooks/use-username"
import { format } from "date-fns"
import { useRealtime } from "@/lib/realtime-client"
import { importKey, encryptMessage, decryptMessage } from "@/lib/crypto"
import type { Message } from "@/lib/realtime"

const formatTimeRemaining = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function ChatRoom() {
  const params = useParams()
  const { username } = useUsername()
  const router = useRouter()

  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [copyStatus, setCopyStatus] = useState("copy")
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  // E2E crypto state
  const cryptoKeyRef = useRef<CryptoKey | null>(null)
  const [keyReady, setKeyReady] = useState(false)
  const [keyError, setKeyError] = useState(false)
  const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([])

  const roomId = params.roomId as string

  // Import the encryption key from the URL fragment on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1) // remove leading #
    const hashParams = new URLSearchParams(hash)
    const encoded = hashParams.get("k")

    if (!encoded) {
      setKeyError(true)
      return
    }

    importKey(encoded)
      .then((key) => {
        cryptoKeyRef.current = key
        setKeyReady(true)
      })
      .catch(() => setKeyError(true))
  }, [])

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } })
      return res.data
    },
  })

  const { data, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } })
      return res.data
    },
    enabled: keyReady, // don't fetch until key is ready
  })

  // Decrypt all messages whenever raw data or key readiness changes
  useEffect(() => {
    if (!keyReady || !cryptoKeyRef.current || !data?.messages) return

    const key = cryptoKeyRef.current
    Promise.all(
      data.messages.map(async (msg) => {
        try {
          const text = await decryptMessage(key, msg.text)
          return { ...msg, text }
        } catch {
          return { ...msg, text: "[encrypted message]" }
        }
      })
    ).then(setDecryptedMessages)
  }, [data?.messages, keyReady])

  const { mutate: sendMessage, isPending: isSendMessagePending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } }
      )
    },
  })

  const { mutate: destroyRoom, isPending: isDestroyRoomPending } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } })
    },
  })

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") refetch()
      if (event === "chat.destroy") router.push("/?destroyed=true")
    },
  })

  useEffect(() => {
    if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl)
  }, [ttlData])

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return
    if (timeRemaining === 0) {
      router.push("/?destroyed=true")
      return
    }
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timeRemaining, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [decryptedMessages])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopyStatus("copied!")
    setTimeout(() => setCopyStatus("copy"), 2000)
  }

  const handleSend = async () => {
    if (!input.trim() || isSendMessagePending || !cryptoKeyRef.current) return
    const encryptedText = await encryptMessage(cryptoKeyRef.current, input)
    sendMessage({ text: encryptedText })
    setInput("")
    inputRef.current?.focus()
  }

  const isTimerCritical = timeRemaining !== null && timeRemaining < 60

  // Missing key error state
  if (keyError) {
    return (
      <main className="flex flex-col h-svh items-center justify-center bg-linear-bg px-6">
        <div className="w-full max-w-[420px] border border-linear-danger/20 rounded-xl px-[18px] py-[14px] bg-linear-danger/5 text-center">
          <p className="text-[11px] font-[510] tracking-[0.12em] uppercase text-linear-danger mb-1">
            Missing Encryption Key
          </p>
          <p className="text-sm text-linear-muted leading-relaxed">
            Use the full room link to access this room.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-col h-svh overflow-hidden bg-linear-bg">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 bg-linear-panel border-b border-linear-border-subtle flex-shrink-0">
        {/* Left: logo + room info */}
        <div className="flex items-center gap-5">
          <span className="text-[22px] font-[400] tracking-[-0.02em] text-linear-text leading-none">
            yuna
          </span>

          <div className="w-px h-7 bg-linear-border-subtle flex-shrink-0" />

          <div>
            <p className="text-[10px] font-[510] tracking-[0.1em] uppercase text-linear-muted mb-0.5">
              Room
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-[510] text-linear-text tracking-tight">
                {roomId}
              </span>
              <button
                onClick={copyLink}
                className="border border-linear-border-subtle rounded px-2 py-0.5 text-[10px] font-[510] tracking-[0.08em] uppercase text-linear-muted bg-transparent hover:text-linear-accent hover:border-linear-accent transition-colors cursor-pointer"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="w-px h-7 bg-linear-border-subtle flex-shrink-0" />

          <div>
            <p className="text-[10px] font-[510] tracking-[0.1em] uppercase text-linear-muted mb-0.5">
              Self-Destruct
            </p>
            <span
              className={`text-sm font-[510] tabular-nums transition-colors ${
                isTimerCritical ? "text-linear-danger" : "text-linear-text"
              }`}
            >
              {timeRemaining !== null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>
        </div>

        {/* Right: destroy button */}
        <button
          disabled={isDestroyRoomPending}
          onClick={() => destroyRoom()}
          className="flex items-center gap-1.5 h-9 px-4 rounded-full border border-linear-border-subtle bg-[rgba(255,255,255,0.02)] text-linear-muted text-[13px] font-[510] hover:bg-linear-danger/10 hover:border-linear-danger/40 hover:text-linear-danger transition-colors disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
        >
          <Bomb size={13} />
          destroy
        </button>
      </header>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-7">
        {data?.messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-linear-muted">
            No messages yet — start the conversation.
          </div>
        )}

        <div className="flex flex-col gap-[22px]">
          {decryptedMessages.map((msg) => {
            const isOwn = msg.sender === username
            return (
              <div key={msg.id}>
                <div className="flex items-baseline gap-2.5 mb-1.5">
                  <span
                    className={`text-[11px] font-[510] tracking-[0.06em] uppercase ${
                      isOwn ? "text-linear-accent" : "text-linear-body"
                    }`}
                  >
                    {isOwn ? "you" : msg.sender}
                  </span>
                  <span className="text-[11px] text-linear-subtle tabular-nums">
                    {format(msg.timestamp, "HH:mm")}
                  </span>
                </div>
                <p className="text-[15px] leading-[1.56] text-linear-body break-words max-w-[600px] m-0">
                  {msg.text}
                </p>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input area ──────────────────────────────────────────────── */}
      <div className="px-5 py-3.5 border-t border-linear-border-subtle bg-linear-panel flex-shrink-0">
        <div className="flex gap-2.5 items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend()
            }}
            autoFocus
            placeholder="Type a message…"
            className="flex-1 h-12 px-5 rounded-full border border-linear-border bg-linear-surface text-[15px] text-linear-text placeholder:text-linear-muted focus:outline-none focus:border-linear-accent transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSendMessagePending || !keyReady}
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              input.trim() && !isSendMessagePending && keyReady
                ? "bg-linear-brand text-white cursor-pointer"
                : "bg-linear-hover text-linear-muted cursor-not-allowed"
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </main>
  )
}

export default ChatRoom
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/room/[roomId]/page.tsx"
git commit -m "feat: E2E encrypt messages in ChatRoom using AES-GCM key from URL fragment"
```
