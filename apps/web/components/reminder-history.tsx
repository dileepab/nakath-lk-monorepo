"use client"

import { useEffect, useState } from "react"
import { BellRing, CalendarDays, CheckCircle2, LoaderCircle, MessageCircle, MoonStar, Sparkles, UserRoundPlus } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ReminderHistoryItem = {
  id: string
  category: "rahu" | "poya" | "avurudu" | "test" | "match-request" | "match-approved" | "match-message"
  title: string
  body: string
  sentAt: string | null
}

function formatSentAt(value: string | null) {
  if (!value) return "Queued recently"

  return new Date(value).toLocaleString("en-LK", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function categoryBadge(category: ReminderHistoryItem["category"]) {
  switch (category) {
    case "test":
      return {
        className: "border-violet-400/25 bg-violet-500/12 text-violet-100",
        label: "Test",
        icon: <BellRing className="h-4 w-4 text-violet-300" />,
      }
    case "rahu":
      return {
        className: "border-rose-400/25 bg-rose-500/12 text-rose-100",
        label: "Rahu",
        icon: <Sparkles className="h-4 w-4 text-rose-300" />,
      }
    case "poya":
      return {
        className: "border-sky-400/25 bg-sky-500/12 text-sky-100",
        label: "Poya",
        icon: <MoonStar className="h-4 w-4 text-sky-300" />,
      }
    case "avurudu":
      return {
        className: "border-amber-400/25 bg-amber-500/12 text-amber-100",
        label: "Avurudu",
        icon: <CalendarDays className="h-4 w-4 text-amber-300" />,
      }
    case "match-request":
      return {
        className: "border-fuchsia-400/25 bg-fuchsia-500/12 text-fuchsia-100",
        label: "Request",
        icon: <UserRoundPlus className="h-4 w-4 text-fuchsia-300" />,
      }
    case "match-approved":
      return {
        className: "border-emerald-400/25 bg-emerald-500/12 text-emerald-100",
        label: "Approved",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
      }
    case "match-message":
      return {
        className: "border-primary/25 bg-primary/12 text-primary-foreground",
        label: "Message",
        icon: <MessageCircle className="h-4 w-4 text-primary" />,
      }
  }
}

export function ReminderHistory() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ReminderHistoryItem[]>([])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false
    const currentUser = user

    async function loadHistory() {
      try {
        setLoading(true)
        setError(null)
        const idToken = await currentUser.getIdToken()
        const response = await fetch("/api/notifications/history", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Could not load reminder history.")
        }

        const payload = (await response.json()) as {
          reminders: ReminderHistoryItem[]
        }

        if (!cancelled) {
          setItems(payload.reminders)
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Could not load reminder history.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <CardHeader className="space-y-3 pb-5">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-primary" />
          <CardTitle className="text-xl text-foreground">Notification history</CardTitle>
        </div>
        <CardDescription className="leading-6 text-muted-foreground">
          A quick record of the most recent calendar and match notifications this account received.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
            Loading reminder history...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">
            {error}
          </div>
        ) : items.length ? (
          items.map((item) => {
            const badge = categoryBadge(item.category)
            return (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge className={`rounded-full px-3 py-1 font-medium ${badge.className}`}>
                      {badge.icon}
                      <span className="ml-2">{badge.label}</span>
                    </Badge>
                    <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{formatSentAt(item.sentAt)}</p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-muted-foreground">
            No notifications have been recorded for this account yet. Once a calendar reminder or match alert is sent, it will show up here.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
