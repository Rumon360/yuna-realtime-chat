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
