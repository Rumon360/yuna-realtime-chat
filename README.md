# Yuna - Real-Time Anonymous Chat

Yuna is a lightweight, real-time anonymous chat app where users can chat by sharing a unique link. Chats automatically self-destruct 10 minutes after creation, ensuring privacy and temporary conversations.

## Features

- Anonymous chat with a unique shareable link
- Real-time messaging powered by Upstash Realtime
- Automatic chat expiration after 10 minutes
- Built with Next.js, React, and Elysia
- Type-safe validation with Zod
- TailwindCSS for styling

## Tech Stack

- **Frontend:** Next.js, React, TailwindCSS
- **Backend:** Elysia, Upstash Realtime
- **Database:** Upstash Redis
- **Utilities:** nanoid for unique IDs, date-fns for time handling, Zod for validation
