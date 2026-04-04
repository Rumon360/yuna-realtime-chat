"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useState } from "react"

export default function Page() {
  const [username, setUsername] = useState("Rumon")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Yuna
          </h1>
          <p className="text-sm text-zinc-500">
            A private, self-destructing chat room.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 border border-border p-3">{username}</div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">CREATE SECURE ROOM</Button>
          </CardFooter>
        </Card>
      </div>
      <div className="mt-4 font-mono text-xs text-muted-foreground">
        (Press <kbd>d</kbd> to toggle dark mode)
      </div>
    </main>
  )
}
