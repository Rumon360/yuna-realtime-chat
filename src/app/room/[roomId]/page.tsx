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

type PendingMessage = {
  id: string
  sender: string
  text: string
  timestamp: number
  roomId: string
}

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

  const cryptoKeyRef = useRef<CryptoKey | null>(null)
  const [keyReady, setKeyReady] = useState(false)
  const [keyError, setKeyError] = useState(false)
  const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([])
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([])

  const roomId = params.roomId as string

  useEffect(() => {
    const hash = window.location.hash.slice(1) // remove leading #
    const hashParams = new URLSearchParams(hash)
    const encoded = hashParams.get("k")

    Promise.resolve(encoded ? importKey(encoded) : null)
      .then((key) => {
        if (key) {
          cryptoKeyRef.current = key
          setKeyReady(true)
        } else {
          setKeyError(true)
        }
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
    ).then((msgs) => {
      setDecryptedMessages(msgs)
      setPendingMessages([])
    })
  }, [data?.messages, keyReady])

  const { mutate: sendMessage, isPending: isSendMessagePending } = useMutation({
    mutationFn: async ({ text }: { text: string; tempId: string }) => {
      await client.messages.post(
        { sender: username, text },
        { query: { roomId } }
      )
    },
    onError: (_error, { tempId }) => {
      setPendingMessages((prev) => prev.filter((m) => m.id !== tempId))
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
    const ttl = ttlData?.ttl
    if (ttl === undefined) return

    const initTimeout = setTimeout(() => setTimeRemaining(ttl), 0)

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearTimeout(initTimeout)
      clearInterval(interval)
    }
  }, [ttlData?.ttl])

  useEffect(() => {
    if (timeRemaining === 0) router.push("/?destroyed=true")
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

  const isTimerCritical = timeRemaining !== null && timeRemaining < 60

  if (keyError) {
    return (
      <main className="flex h-svh flex-col items-center justify-center bg-linear-bg px-6">
        <div className="w-full max-w-[420px] rounded-xl border border-linear-danger/20 bg-linear-danger/5 px-[18px] py-[14px] text-center">
          <p className="mb-1 text-[11px] font-[510] tracking-[0.12em] text-linear-danger uppercase">
            Missing Encryption Key
          </p>
          <p className="text-sm leading-relaxed text-linear-muted">
            Use the full room link to access this room.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-linear-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-linear-border-subtle bg-linear-panel px-5 py-3">
        <div className="flex items-center gap-5">
          <span className="text-[22px] leading-none font-normal tracking-[-0.02em] text-linear-text">
            yuna
          </span>

          <div className="h-7 w-px shrink-0 bg-linear-border-subtle" />

          <div>
            <p className="mb-0.5 text-[10px] font-[510] tracking-[0.1em] text-linear-muted uppercase">
              Room
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-[510] tracking-tight text-linear-text">
                {roomId}
              </span>
              <button
                onClick={copyLink}
                className="cursor-pointer rounded border border-linear-border-subtle bg-transparent px-2 py-0.5 text-[10px] font-[510] tracking-[0.08em] text-linear-muted uppercase transition-colors hover:border-linear-accent hover:text-linear-accent"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-7 w-px shrink-0 bg-linear-border-subtle" />

          <div>
            <p className="mb-0.5 text-[10px] font-[510] tracking-[0.1em] text-linear-muted uppercase">
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

        <button
          disabled={isDestroyRoomPending}
          onClick={() => destroyRoom()}
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-linear-border-subtle bg-[rgba(255,255,255,0.02)] px-4 text-[13px] font-[510] text-linear-muted transition-colors hover:border-linear-danger/40 hover:bg-linear-danger/10 hover:text-linear-danger disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Bomb size={13} />
          destroy
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-7">
        {decryptedMessages.length === 0 && pendingMessages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-linear-muted">
            No messages yet — start the conversation.
          </div>
        )}

        <div className="flex flex-col gap-[22px]">
          {[...decryptedMessages, ...pendingMessages].map((msg) => {
            const isOwn = msg.sender === username
            return (
              <div key={msg.id}>
                <div className="mb-1.5 flex items-baseline gap-2.5">
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
                <p className="m-0 max-w-[600px] text-[15px] leading-[1.56] wrap-break-word text-linear-body">
                  {msg.text}
                </p>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-linear-border-subtle bg-linear-panel px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend()
            }}
            autoFocus
            placeholder="Type a message…"
            className="h-12 flex-1 rounded-full border border-linear-border bg-linear-surface px-5 text-[15px] text-linear-text transition-colors placeholder:text-linear-muted focus:border-linear-accent focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSendMessagePending || !keyReady}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
              input.trim() && !isSendMessagePending && keyReady
                ? "cursor-pointer bg-linear-brand text-white"
                : "cursor-not-allowed bg-linear-hover text-linear-muted"
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
