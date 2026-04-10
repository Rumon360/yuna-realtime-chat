# Optimistic Chat Updates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make sent messages appear in the chat immediately, before the server round-trip completes.

**Architecture:** A `pendingMessages` state array holds optimistic plaintext messages. On send, an entry is pushed immediately. The mutation's `onSettled` callback removes the entry by temp ID. The render merges `decryptedMessages` and `pendingMessages` into a single list.

**Tech Stack:** Next.js 14, React, TanStack Query (`useMutation`), TypeScript — all changes confined to one file.

---

### Task 1: Add `pendingMessages` state and merge it into the render

**Files:**
- Modify: `src/app/room/[roomId]/page.tsx`

- [ ] **Step 1: Add the `PendingMessage` type and `pendingMessages` state**

  In `src/app/room/[roomId]/page.tsx`, add the type above the `ChatRoom` component and add the state inside it alongside the other `useState` declarations:

  ```ts
  // Above the ChatRoom function
  type PendingMessage = {
    id: string
    sender: string
    text: string
    timestamp: number
    roomId: string
  }
  ```

  Inside `ChatRoom`, after `const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([])`:

  ```ts
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([])
  ```

- [ ] **Step 2: Merge pending messages into the render**

  Find the `decryptedMessages.map(...)` call in the JSX (around line 236). Replace:

  ```tsx
  {decryptedMessages.map((msg) => {
  ```

  With:

  ```tsx
  {[...decryptedMessages, ...pendingMessages].map((msg) => {
  ```

- [ ] **Step 3: Verify the app compiles**

  Run: `npm run build` (or check the dev server for type errors)  
  Expected: No TypeScript errors. `PendingMessage` is structurally compatible with `Message` so the existing map body works unchanged.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/room/[roomId]/page.tsx
  git commit -m "feat: add pendingMessages state and merge into render"
  ```

---

### Task 2: Push optimistic message on send and clear it on settle

**Files:**
- Modify: `src/app/room/[roomId]/page.tsx`

- [ ] **Step 1: Update `handleSend` to push an optimistic entry before calling `sendMessage`**

  Replace the existing `handleSend` function:

  ```ts
  const handleSend = async () => {
    if (!input.trim() || isSendMessagePending || !cryptoKeyRef.current) return
    const encryptedText = await encryptMessage(cryptoKeyRef.current, input)
    sendMessage({ text: encryptedText })
    setInput("")
    inputRef.current?.focus()
  }
  ```

  With:

  ```ts
  const handleSend = async () => {
    if (!input.trim() || isSendMessagePending || !cryptoKeyRef.current) return

    const plaintext = input
    const tempId = crypto.randomUUID()

    setPendingMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender: username,
        text: plaintext,
        timestamp: Date.now(),
        roomId,
      },
    ])

    setInput("")
    inputRef.current?.focus()

    const encryptedText = await encryptMessage(cryptoKeyRef.current, plaintext)
    sendMessage({ text: encryptedText, tempId })
  }
  ```

- [ ] **Step 2: Update `sendMessage` mutation to accept `tempId` and clear the pending entry on settle**

  Replace the existing `useMutation` call:

  ```ts
  const { mutate: sendMessage, isPending: isSendMessagePending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } }
      )
    },
  })
  ```

  With:

  ```ts
  const { mutate: sendMessage, isPending: isSendMessagePending } = useMutation({
    mutationFn: async ({ text }: { text: string; tempId: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } }
      )
    },
    onSettled: (_data, _error, { tempId }) => {
      setPendingMessages((prev) => prev.filter((m) => m.id !== tempId))
    },
  })
  ```

- [ ] **Step 3: Verify the app compiles**

  Run: `npm run build`  
  Expected: No TypeScript errors.

- [ ] **Step 4: Manual smoke test**

  1. Start the dev server: `npm run dev`
  2. Open a room in one browser tab
  3. Type a message and press Enter
  4. **Expected:** The message appears in the list immediately (optimistic), then stays there after the server confirms (real message from refetch replaces it seamlessly)
  5. Open a second tab in the same room and send a message — it should still appear in the first tab via realtime

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/room/[roomId]/page.tsx
  git commit -m "feat: optimistic message display on send"
  ```
