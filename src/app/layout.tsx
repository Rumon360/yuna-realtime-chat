import { Inter } from "next/font/google"
import { Metadata } from "next"
import { cn } from "@/lib/utils"
import Providers from "@/components/providers"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
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
      className={cn("dark antialiased", inter.variable, "font-sans")}
    >
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
