"use client"

import { Button } from "@/components/ui/button"
import { Bomb, SearchIcon, Send } from "lucide-react"
import { useParams } from "next/navigation"
import { useRef, useState } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

const formatTimeRemaining = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function ChatRoom() {
  const params = useParams()

  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [copyStatus, setCopyStatus] = useState("COPY")
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const roomId = params.roomId as string

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopyStatus("COPIED!")
    setTimeout(() => setCopyStatus("COPY"), 2000)
  }

  return (
    <main className="flex h-svh max-h-svh flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Room
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-primary">
                {roomId}
              </span>
              <button
                onClick={copyLink}
                className="border border-border px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase transition-all hover:border-primary hover:text-foreground"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Self Destruct
            </span>

            <span
              className={`text-sm font-bold tabular-nums ${
                timeRemaining !== null && timeRemaining < 60
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              {timeRemaining !== null
                ? formatTimeRemaining(timeRemaining)
                : "--:--"}
            </span>
          </div>
        </div>
        <Button variant={"destructive"} className="text-xs font-semibold">
          <Bomb /> DESTROY NOW
        </Button>
      </header>
      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4"></div>
      <div className="border-t border-border bg-background/30 p-4">
        <div className="flex gap-2">
          <div className="group relative flex-1">
            <InputGroup>
              <InputGroupInput
                ref={inputRef}
                value={input}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim()) {
                    // TODO: Send Message
                    inputRef.current?.focus()
                    setInput("")
                  }
                }}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                placeholder="Type message..."
              />
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
            </InputGroup>
          </div>
          <Button size={"icon"} variant={"secondary"} className="font-semibold">
            <Send />
          </Button>
        </div>
      </div>
    </main>
  )
}

export default ChatRoom
