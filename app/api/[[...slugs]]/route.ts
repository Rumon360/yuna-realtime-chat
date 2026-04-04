import { Elysia } from "elysia"

export const app = new Elysia({ prefix: "/api" }).get("/user", {
  user: { name: "Rumon" },
})

export const GET = app.fetch
export const POST = app.fetch
