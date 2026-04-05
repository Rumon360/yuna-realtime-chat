import { redis } from "@/lib/redis"
import { Elysia } from "elysia"
import { nanoid } from "nanoid"

const ROOM_TTL_SECONDS = 60 * 10 // 10 Mins

const rooms = new Elysia({ prefix: "/room" }).post("/create", async () => {
  const roomId = nanoid()
  const roomName = `meta:${roomId}`

  await redis.hset(roomName, {
    connected: [],
    createdAt: Date.now(),
  })

  await redis.expire(roomName, ROOM_TTL_SECONDS)

  return { roomId }
})

export const app = new Elysia({ prefix: "/api" }).use(rooms)

export const GET = app.fetch
export const POST = app.fetch

export type App = typeof app
