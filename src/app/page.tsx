"use client"

import { Button } from "@/components/ui/button"
import useUsername from "@/hooks/use-username"
import { client } from "@/lib/client"
import { generateKey } from "@/lib/crypto"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"

function NotificationBanner({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="mb-6 w-full max-w-[420px] rounded-xl border border-linear-danger/20 bg-linear-danger/5 px-[18px] py-[14px] text-center">
      <p className="mb-1 text-[11px] font-[510] tracking-[0.12em] text-linear-danger uppercase">
        {title}
      </p>
      <p className="text-sm leading-relaxed text-linear-muted">{message}</p>
    </div>
  )
}

function Lobby() {
  const router = useRouter()
  const { username, setUsername } = useUsername()
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const searchParams = useSearchParams()

  const wasDestroyed = searchParams.get("destroyed") === "true"
  const error = searchParams.get("error")

  const commitEdit = () => {
    const trimmed = draft.trim()
    if (trimmed) setUsername(trimmed)
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

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
    <main className="flex min-h-svh flex-col items-center justify-center bg-linear-bg px-6 py-14">
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

      <div className="w-full max-w-[420px] rounded-2xl border border-linear-border p-8">
        <p className="mb-2.5 text-[11px] font-[510] tracking-[0.12em] text-linear-subtle uppercase">
          Your Anonymous Identity
        </p>

        {isEditing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit()
              if (e.key === "Escape") cancelEdit()
            }}
            className="mb-5 w-full rounded-xl border border-linear-accent bg-linear-hover px-4 py-3 text-base font-[510] tracking-tight text-linear-text outline-none"
          />
        ) : (
          <div
            onClick={() => {
              setDraft(username)
              setIsEditing(true)
            }}
            className="mb-5 cursor-pointer rounded-xl border border-linear-border bg-linear-hover px-4 py-3 text-base font-[510] tracking-tight text-linear-text transition-colors hover:border-linear-accent"
          >
            {username}
          </div>
        )}

        <Button
          disabled={isCreateRoomPending}
          onClick={() => createRoom()}
          className="h-12 w-full cursor-pointer rounded-full text-base"
        >
          {isCreateRoomPending ? "creating…" : "create secure room"}
        </Button>

        <p className="mt-4 text-center text-[13px] leading-relaxed text-linear-muted">
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
