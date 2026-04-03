"use client"

import { useEffect, useMemo, useState } from "react"
import { BellRing, CalendarDays, Languages, LoaderCircle, MoonStar, Sparkles } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  formatAuspiciousEventDate,
  getAuspiciousEventTone,
  getUpcomingAuspiciousEvents,
  type AuspiciousEvent,
} from "@/lib/auspicious-events"
import { saveProfileDraftToBackend } from "@/lib/profile-store"
import { cn } from "@/lib/utils"
import { initialProfileDraft, type ProfileDraft, type ReminderLanguage } from "@acme/core"

type AlertKey = Exclude<keyof ProfileDraft["alerts"], "language">
type SaveKey = AlertKey | "language"
type EventsState = "idle" | "loading" | "ready" | "error"

const alertOptions: Array<{
  key: AlertKey
  title: string
  description: string
}> = [
  {
    key: "poyaDays",
    title: "Poya day reminders",
    description: "A gentle reminder on Poya morning so the day is visible early without being noisy.",
  },
  {
    key: "avuruduNekath",
    title: "Avurudu nekath alerts",
    description: "Seasonal reminders for Aluth Avurudu Udawa, Lipa gini melaweema, and related timings.",
  },
  {
    key: "rahuKalaya",
    title: "Rahu kalaya starts",
    description: "Daily alert shortly before the inauspicious window begins, only if you want that rhythm.",
  },
  {
    key: "matchActivity",
    title: "Match activity",
    description: "Keep request, approval, and conversation alerts grouped under the same preference set.",
  },
]

export function UpcomingAuspiciousTimes({
  userId,
  draft,
  onDraftChange,
}: {
  userId: string
  draft: ProfileDraft | null
  onDraftChange: (draft: ProfileDraft) => void
}) {
  const { user } = useAuth()
  const [savingKey, setSavingKey] = useState<SaveKey | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [pushStatus, setPushStatus] = useState("Checking browser")
  const [eventsState, setEventsState] = useState<EventsState>("loading")
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [events, setEvents] = useState<AuspiciousEvent[]>(() => getUpcomingAuspiciousEvents(new Date(), 5))

  const effectiveDraft = draft ?? initialProfileDraft
  const hasFallbackEvents = useMemo(() => eventsState !== "ready" && events.length > 0, [events, eventsState])

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPushStatus("Browser notifications unavailable")
      return
    }

    setPushStatus(
      Notification.permission === "granted"
        ? "Ready in this browser"
        : Notification.permission === "denied"
          ? "Blocked in browser"
          : "Enable from the card above",
    )
  }, [])

  useEffect(() => {
    if (!user) {
      setEventsState("idle")
      return
    }

    const currentUser = user
    let cancelled = false

    async function loadEvents() {
      try {
        setEventsState("loading")
        setEventsError(null)
        const idToken = await currentUser.getIdToken()
        const response = await fetch("/api/notifications/history?resource=auspicious-events&limit=5", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Could not load the managed auspicious calendar.")
        }

        const payload = (await response.json()) as {
          events: Array<{
            id: string
            category: AuspiciousEvent["category"]
            title: string
            description: string
            startsAt: string
            isAllDay?: boolean
          }>
        }

        if (cancelled) return

        setEvents(
          payload.events.map((event) => ({
            ...event,
            startsAt: new Date(event.startsAt),
          })),
        )
        setEventsState("ready")
      } catch (error) {
        if (cancelled) return
        setEventsState("error")
        setEventsError(error instanceof Error ? error.message : "Could not load the managed auspicious calendar.")
      }
    }

    void loadEvents()

    return () => {
      cancelled = true
    }
  }, [user])

  async function handleLanguageChange(language: ReminderLanguage) {
    if (!draft || !userId) {
      setSaveError("Save your biodata first, then we can remember these reminder choices.")
      return
    }

    const nextDraft: ProfileDraft = {
      ...effectiveDraft,
      alerts: {
        ...effectiveDraft.alerts,
        language,
      },
    }

    onDraftChange(nextDraft)
    setSaveError(null)
    setSavingKey("language")

    try {
      await saveProfileDraftToBackend(userId, nextDraft)
    } catch (error) {
      onDraftChange(draft)
      setSaveError("Could not save reminder language right now.")
    } finally {
      setSavingKey(null)
    }
  }

  async function handleToggle(key: AlertKey, checked: boolean) {
    if (!draft || !userId) {
      setSaveError("Save your biodata first, then we can remember these reminder choices.")
      return
    }

    const nextDraft: ProfileDraft = {
      ...effectiveDraft,
      alerts: {
        ...effectiveDraft.alerts,
        [key]: checked,
      },
    }

    onDraftChange(nextDraft)
    setSaveError(null)

    setSavingKey(key)

    try {
      await saveProfileDraftToBackend(userId, nextDraft)
    } catch (error) {
      onDraftChange(draft)
      setSaveError("Could not save reminder preferences right now.")
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <Card className="border-white/10 bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <CardHeader className="space-y-3 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge className="rounded-full border border-primary/25 bg-primary/12 px-4 py-1.5 font-medium text-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              Auspicious reminders
            </Badge>
            <CardTitle className="mt-4 text-2xl text-foreground">Upcoming times worth knowing</CardTitle>
            <CardDescription className="mt-2 max-w-xl leading-6 text-muted-foreground">
              A small Sri Lankan calendar layer for Rahu kalaya, Poya days, and New Year nekath so the app stays useful
              even when you are not actively browsing matches.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Push status</p>
            <p className="mt-2 text-sm font-medium text-foreground">{pushStatus}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          {eventsState === "loading" ? (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                Loading managed auspicious events...
              </div>
            </div>
          ) : null}

          {eventsError ? (
            <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50">
              {eventsError}
              {hasFallbackEvents ? " Showing the bundled fallback schedule for now." : ""}
            </div>
          ) : null}

          {events.map((event) => {
            const tone = getAuspiciousEventTone(event.category)

            return (
              <div key={event.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge className={cn("rounded-full px-3 py-1 font-medium", tone.badge)}>{tone.label}</Badge>
                    <p className="mt-3 text-base font-semibold text-foreground">{event.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.description}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {event.isAllDay ? "Calendar day" : "Starts"}
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">{formatAuspiciousEventDate(event)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
              <BellRing className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Choose the alerts that should matter</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Keep it useful. The daily Rahu alert can stay off if you only want bigger moments like Poya and Avurudu.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <Languages className="mt-0.5 h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Reminder language</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose the language for calendar and match notifications. This does not change the full app language yet.
                  </p>
                  <Select
                    value={effectiveDraft.alerts.language}
                    disabled={!draft || Boolean(savingKey)}
                    onValueChange={(value) => void handleLanguageChange(value as ReminderLanguage)}
                  >
                    <SelectTrigger className="mt-4 border-white/10 bg-black/20 text-foreground">
                      <SelectValue placeholder="Choose a reminder language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="si">සිංහල</SelectItem>
                      <SelectItem value="ta">தமிழ்</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {alertOptions.map((option) => {
              const icon =
                option.key === "poyaDays" ? (
                  <MoonStar className="h-4 w-4 text-sky-300" />
                ) : option.key === "avuruduNekath" ? (
                  <CalendarDays className="h-4 w-4 text-amber-300" />
                ) : option.key === "rahuKalaya" ? (
                  <Sparkles className="h-4 w-4 text-rose-300" />
                ) : (
                  <BellRing className="h-4 w-4 text-primary" />
                )

              return (
                <div key={option.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {icon}
                        <p className="text-sm font-semibold text-foreground">{option.title}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{option.description}</p>
                    </div>
                    <Switch
                      checked={effectiveDraft.alerts[option.key]}
                      disabled={!draft || savingKey === option.key}
                      onCheckedChange={(checked) => void handleToggle(option.key, checked)}
                      aria-label={option.title}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {draft ? "Preferences save to your profile" : "Save your biodata to remember these settings"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Browser push still needs permission, even when the preference is switched on here.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {savingKey ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : null}
              {savingKey ? "Saving..." : "Synced locally"}
            </div>
          </div>

          {saveError ? <p className="mt-3 text-sm text-rose-300">{saveError}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
