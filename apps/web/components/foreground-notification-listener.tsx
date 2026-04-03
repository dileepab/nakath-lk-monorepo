"use client"

import { useEffect } from "react"
import { BellRing } from "lucide-react"
import { toast } from "sonner"

import { subscribeToForegroundMessages } from "@/lib/notifications"

type ForegroundPayload = {
  notification?: {
    title?: string
    body?: string
  }
}

export function ForegroundNotificationListener() {
  useEffect(() => {
    const unsubscribe = subscribeToForegroundMessages((payload) => {
      const nextPayload = payload as ForegroundPayload
      const title = nextPayload.notification?.title ?? "Nakath notification"
      const body = nextPayload.notification?.body ?? "A new reminder just arrived."

      toast(title, {
        description: body,
        icon: <BellRing className="h-4 w-4" />,
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return null
}
