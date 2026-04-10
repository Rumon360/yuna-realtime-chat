"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactNode, useState } from "react"
import { RealtimeProvider } from "@upstash/realtime/client"

type Props = {
  children: ReactNode
}

function Providers({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <RealtimeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </RealtimeProvider>
  )
}

export default Providers
