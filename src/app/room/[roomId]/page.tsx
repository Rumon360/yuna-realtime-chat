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
