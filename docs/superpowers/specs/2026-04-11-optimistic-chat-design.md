# Optimistic Chat Updates — Design Spec

**Date:** 2026-04-11  
**Status:** Approved

## Problem

After a user sends a message, it does not appear in their own chat until the full round-trip completes: send → server stores → realtime broadcast → refetch → decrypt. This introduces noticeable latency in perceived message delivery.

## Goal

Messages appear in the UI immediately when the user hits send, with no visual difference from server-confirmed messages.

## Approach: Parallel `pendingMessages` State

The existing architecture has two data layers:

- `data.messages` — encrypted messages from the server (TanStack Query cache)
- `decryptedMessages` — plaintext version, derived by a `useEffect` that decrypts `data.messages`

Because `decryptedMessages` is fully controlled by that effect (overwritten on every refetch), optimistic messages cannot be injected there directly. Instead, a parallel `pendingMessages` state lives in plaintext-land and is merged with `decryptedMessages` at render time.

## State

```ts
type PendingMessage = {
  id: string        // temp UUID, never matches a server ID
  sender: string
  text: string      // plaintext (user typed it)
  timestamp: number
  roomId: string
}

const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([])
```

## Flow

1. User calls `handleSend`
2. A temp ID is generated via `crypto.randomUUID()`
3. Optimistic entry is pushed to `pendingMessages` immediately (before encryption or network call)
4. `encryptMessage` runs, `sendMessage` mutation fires
5. The temp ID is captured in closure and passed to mutation callbacks
6. `onSettled` (fires on both success and error): filter the temp ID out of `pendingMessages`
7. On success: the server stores the message and broadcasts a realtime event → `refetch()` → `decryptedMessages` updates with the real message
8. On error: the optimistic entry is simply removed (silent rollback, no UX change requested)

## Render

```ts
const allMessages = [...decryptedMessages, ...pendingMessages]
```

Pending messages naturally appear after confirmed ones because their timestamp is `Date.now()` at send time. No deduplication is needed since temp UUIDs cannot collide with server-generated IDs.

The existing message rendering loop maps over `allMessages` unchanged — no style differences for pending messages.

## No changes to

- Server, API routes, or realtime schema
- Encryption/decryption logic
- Message rendering markup or styles
- TanStack Query cache structure
