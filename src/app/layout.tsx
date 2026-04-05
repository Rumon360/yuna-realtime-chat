import { JetBrains_Mono } from "next/font/google"
import { Metadata } from "next"
import { cn } from "@/lib/utils"
import Providers from "@/components/providers"

import "./globals.css"

const JetBrainsMono = JetBrains_Mono({
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
      suppressHydrationWarning
      className={cn("antialiased", JetBrainsMono.variable, "font-sans")}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
