# Yuna - Real-Time Anonymous Chat

Yuna is a lightweight, real-time anonymous chat app where users can chat by sharing a unique link. Chats automatically self-destruct 10 minutes after creation, ensuring privacy and temporary conversations.

## Features

- Anonymous identity with a customizable username (click to edit)
- End-to-end encrypted messages using AES-GCM — encryption key lives only in the URL fragment, never sent to the server
- Shareable room link with embedded key — anyone with the link can join and read messages
- Optimistic message sending — messages appear instantly on send
- Real-time messaging powered by Upstash Realtime
- Rooms self-destruct after 10 minutes; all messages are permanently deleted
- Room capacity limit enforced server-side

## Tech Stack

- **Frontend:** Next.js, React, TailwindCSS
- **Backend:** Elysia, Upstash Realtime
- **Database:** Upstash Redis
- **State & Data Fetching:** TanStack Query
- **Utilities:** nanoid (unique IDs), date-fns (time handling), Zod (validation)

## How It Works

1. Create a room — a unique room ID and AES-GCM encryption key are generated client-side
2. Share the link — the key is embedded in the URL fragment (`#k=...`) and never leaves the browser
3. Send messages — each message is encrypted before being sent to the server; the server stores only ciphertext
4. Real-time updates — Upstash Realtime broadcasts events to all room members, who decrypt messages locally
5. Self-destruct — rooms expire after 10 minutes or can be manually destroyed by any member
