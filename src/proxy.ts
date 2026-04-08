import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { redis } from "@/lib/redis"
import { nanoid } from "nanoid"

export async function proxy(request: NextRequest) {
  const pathName = request.nextUrl.pathname

  const roomMatch = pathName.match(/^\/room\/([^/]+)$/)

  if (!roomMatch) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const roomId = roomMatch[1]

  const meta = await redis.hgetall<{ connected: string[]; createdAt: number }>(
    `meta:${roomId}`
  )

  if (!meta) {
    return NextResponse.redirect(new URL("/?error=room-not-found", request.url))
  }

  const existingToken = request.cookies.get("x-auth-token")?.value

  // USER ALLOWED TO JOIN ROOM
  if (existingToken && meta.connected.includes(existingToken)) {
    return NextResponse.next()
  }

  //   USER IS NOT ALLOWED TO JOIN
  if (meta.connected.length >= 2) {
    return NextResponse.redirect(new URL("/?error=room-full", request.url))
  }

  const response = NextResponse.next()

  const token = nanoid()

  response.cookies.set("x-auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })

  await redis.hset(`meta:${roomId}`, { connected: [...meta.connected, token] })

  return response
}

export const config = {
  matcher: "/room/:path*",
}
