# Yuna UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Coinbase-inspired UI with a Linear-inspired dark-native design system using Tailwind CSS v4 custom property tokens.

**Architecture:** Define all Linear design tokens as `--color-linear-*` CSS custom properties in `@theme inline` within `globals.css`. Remove theme-switching entirely — hardcode `class="dark"` on `<html>`. Rebuild both pages (Lobby, ChatRoom) using only Tailwind utility classes, removing all inline `style={{}}` props.

**Tech Stack:** Next.js 15, Tailwind CSS v4, Inter (variable font via `next/font/google`), React Query, Lucide React

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/globals.css` | Replace Coinbase tokens with Linear dark tokens; add Linear `@theme` entries; update shadcn CSS vars; remove Coinbase component classes |
| `src/app/layout.tsx` | Swap Sora+DM_Sans → Inter variable; add `class="dark"` permanently to `<html>` |
| `src/components/providers.tsx` | Remove ThemeProvider import and usage |
| `src/app/page.tsx` | Full Tailwind rebuild of Lobby — no inline styles |
| `src/app/room/[roomId]/page.tsx` | Full Tailwind rebuild of ChatRoom — no inline styles |

---

## Task 1: Update globals.css — Linear tokens + dark theme

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace globals.css entirely**

Replace the full file with the following:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-display: var(--font-display);
  --font-heading: var(--font-sans);
  --font-sans: var(--font-sans);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
  --font-mono: "Berkeley Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --radius: 0.5rem;
  --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
  --tracking-tight: calc(var(--tracking-normal) - 0.025em);
  --tracking-wide: calc(var(--tracking-normal) + 0.025em);
  --tracking-wider: calc(var(--tracking-normal) + 0.05em);
  --tracking-widest: calc(var(--tracking-normal) + 0.1em);
  --tracking-normal: var(--tracking-normal);
  --shadow-2xl: var(--shadow-2xl);
  --shadow-xl: var(--shadow-xl);
  --shadow-lg: var(--shadow-lg);
  --shadow-md: var(--shadow-md);
  --shadow: var(--shadow);
  --shadow-sm: var(--shadow-sm);
  --shadow-xs: var(--shadow-xs);
  --shadow-2xs: var(--shadow-2xs);
  --spacing: var(--spacing);
  --letter-spacing: var(--letter-spacing);
  --shadow-offset-y: var(--shadow-offset-y);
  --shadow-offset-x: var(--shadow-offset-x);
  --shadow-spread: var(--shadow-spread);
  --shadow-blur: var(--shadow-blur);
  --shadow-opacity: var(--shadow-opacity);
  --color-shadow-color: var(--shadow-color);
  --color-destructive-foreground: var(--destructive-foreground);

  /* ── Linear Design System ───────────────────────────────────────── */
  --color-linear-bg:           #08090a;
  --color-linear-panel:        #0f1011;
  --color-linear-surface:      #191a1b;
  --color-linear-hover:        #28282c;
  --color-linear-text:         #f7f8f8;
  --color-linear-body:         #d0d6e0;
  --color-linear-muted:        #8a8f98;
  --color-linear-subtle:       #62666d;
  --color-linear-brand:        #5e6ad2;
  --color-linear-accent:       #7170ff;
  --color-linear-accent-hover: #828fff;
  --color-linear-success:      #10b981;
  --color-linear-danger:       #dc3545;
  --color-linear-border:       rgba(255, 255, 255, 0.08);
  --color-linear-border-subtle: rgba(255, 255, 255, 0.05);
}

/* Single permanent dark theme — no light/dark switching */
:root {
  --background: #08090a;
  --foreground: #f7f8f8;
  --card: #191a1b;
  --card-foreground: #f7f8f8;
  --popover: #0f1011;
  --popover-foreground: #f7f8f8;
  --primary: #5e6ad2;
  --primary-foreground: #ffffff;
  --secondary: #191a1b;
  --secondary-foreground: #d0d6e0;
  --muted: #28282c;
  --muted-foreground: #8a8f98;
  --accent: #28282c;
  --accent-foreground: #f7f8f8;
  --destructive: #dc3545;
  --destructive-foreground: #ffffff;
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.08);
  --ring: #7170ff;
  --radius: 0.5rem;

  --chart-1: #5e6ad2;
  --chart-2: #7170ff;
  --chart-3: #828fff;
  --chart-4: #10b981;
  --chart-5: #8a8f98;

  --sidebar: #0f1011;
  --sidebar-foreground: #f7f8f8;
  --sidebar-primary: #5e6ad2;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #28282c;
  --sidebar-accent-foreground: #f7f8f8;
  --sidebar-border: rgba(255, 255, 255, 0.08);
  --sidebar-ring: #7170ff;

  --shadow-color: hsl(0 0% 0%);
  --shadow-opacity: 0.45;
  --shadow-blur: 20px;
  --shadow-spread: 0px;
  --shadow-offset-x: 0px;
  --shadow-offset-y: 6px;
  --letter-spacing: -0.01em;
  --spacing: 0.25rem;
  --tracking-normal: -0.01em;

  --shadow-2xs: 0px 4px 16px 0px hsl(0 0% 0% / 0.20);
  --shadow-xs: 0px 4px 16px 0px hsl(0 0% 0% / 0.25);
  --shadow-sm:
    0px 4px 16px 0px hsl(0 0% 0% / 0.35),
    0px 1px 2px -1px hsl(0 0% 0% / 0.35);
  --shadow:
    0px 4px 20px 0px hsl(0 0% 0% / 0.45),
    0px 1px 2px -1px hsl(0 0% 0% / 0.45);
  --shadow-md:
    0px 6px 20px 0px hsl(0 0% 0% / 0.45),
    0px 2px 4px -1px hsl(0 0% 0% / 0.45);
  --shadow-lg:
    0px 6px 20px 0px hsl(0 0% 0% / 0.45),
    0px 4px 6px -1px hsl(0 0% 0% / 0.45);
  --shadow-xl:
    0px 6px 20px 0px hsl(0 0% 0% / 0.45),
    0px 8px 10px -1px hsl(0 0% 0% / 0.45);
  --shadow-2xl: 0px 6px 32px 0px hsl(0 0% 0% / 0.70);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-linear-bg text-linear-body;
    font-feature-settings: "cv01" "ss03";
  }
  html {
    @apply font-sans;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style: replace Coinbase tokens with Linear dark design system"
```

---

## Task 2: Update layout.tsx — Inter font + permanent dark class

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

```tsx
import { Inter } from "next/font/google"
import { Metadata } from "next"
import { cn } from "@/lib/utils"
import Providers from "@/components/providers"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Yuna",
  description:
    "Yuna is a lightweight, real-time anonymous chat app where users can chat by sharing a unique link. Chats automatically self-destruct 10 minutes after creation, ensuring privacy and temporary conversations.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn("dark antialiased", inter.variable, "font-sans")}
    >
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "style: switch to Inter variable font, hardcode dark class"
```

---

## Task 3: Remove ThemeProvider from providers.tsx

**Files:**
- Modify: `src/components/providers.tsx`

- [ ] **Step 1: Replace providers.tsx**

```tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode, useState } from "react"
import { RealtimeProvider } from "@upstash/realtime/client"

type Props = {
  children: ReactNode
}

function Providers({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <RealtimeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </RealtimeProvider>
  )
}

export default Providers
```

- [ ] **Step 2: Commit**

```bash
git add src/components/providers.tsx
git commit -m "style: remove ThemeProvider, dark mode is permanent"
```

---

## Task 4: Rebuild Lobby page with Tailwind

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace page.tsx**

```tsx
"use client"

import useUsername from "@/hooks/use-username"
import { client } from "@/lib/client"
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
    onSuccess: (data) => {
      toast.success("Room created!", { id: "create-room" })
      if (data?.roomId) {
        router.push(`/room/${data.roomId}`)
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
git commit -m "style: rebuild Lobby with Linear design system + Tailwind"
```

---

## Task 5: Rebuild ChatRoom page with Tailwind

**Files:**
- Modify: `src/app/room/[roomId]/page.tsx`

- [ ] **Step 1: Replace the ChatRoom page**

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

  const roomId = params.roomId as string

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
  })

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
  }, [data?.messages])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopyStatus("copied!")
    setTimeout(() => setCopyStatus("copy"), 2000)
  }

  const handleSend = () => {
    if (!input.trim() || isSendMessagePending) return
    sendMessage({ text: input })
    setInput("")
    inputRef.current?.focus()
  }

  const isTimerCritical = timeRemaining !== null && timeRemaining < 60

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
          {data?.messages.map((msg) => {
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
            disabled={!input.trim() || isSendMessagePending}
            className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              input.trim() && !isSendMessagePending
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
git add src/app/room/[roomId]/page.tsx
git commit -m "style: rebuild ChatRoom with Linear design system + Tailwind"
```
