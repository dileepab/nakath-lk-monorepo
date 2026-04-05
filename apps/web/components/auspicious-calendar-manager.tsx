"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, LoaderCircle, Plus, RotateCcw, Save, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { type StaticEventSeed } from "@/lib/auspicious-events"
import { cn } from "@/lib/utils"

type CalendarEventDraft = {
  id: string
  title: string
  description: string
  date: string
  time: string
  isAllDay: boolean
}

type CalendarResponse = {
  role: "user" | "reviewer" | "admin"
  calendar: {
    year: number
    usingDefaults: boolean
    config: {
      poyaEvents: StaticEventSeed[]
      avuruduEvents: StaticEventSeed[]
    }
  }
}

const CALENDAR_YEAR = 2026

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function seedToDraft(seed: StaticEventSeed): CalendarEventDraft {
  const [year, monthIndex, day, hour = 0, minute = 0] = seed.startsAt
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    date: `${year}-${pad(monthIndex + 1)}-${pad(day)}`,
    time: seed.isAllDay ? "" : `${pad(hour)}:${pad(minute)}`,
    isAllDay: Boolean(seed.isAllDay),
  }
}

function draftToSeed(draft: CalendarEventDraft, category: StaticEventSeed["category"]): StaticEventSeed | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(draft.date)
  if (!dateMatch) return null

  const [, year, month, day] = dateMatch
  const timeMatch = draft.isAllDay ? null : /^(\d{2}):(\d{2})$/.exec(draft.time)
  const hour = timeMatch ? Number(timeMatch[1]) : 0
  const minute = timeMatch ? Number(timeMatch[2]) : 0

  return {
    id: draft.id.trim() || `${category}-${year}-${draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    category,
    title: draft.title.trim(),
    description: draft.description.trim(),
    startsAt: [Number(year), Number(month) - 1, Number(day), hour, minute],
    isAllDay: draft.isAllDay,
  }
}

function emptyDraft(category: StaticEventSeed["category"]): CalendarEventDraft {
  return {
    id: `${category}-${Date.now()}`,
    title: "",
    description: "",
    date: `${CALENDAR_YEAR}-01-01`,
    time: category === "poya" ? "" : "09:00",
    isAllDay: category === "poya",
  }
}

function SectionEditor({
  title,
  description,
  events,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string
  description: string
  events: CalendarEventDraft[]
  onChange: (eventId: string, field: keyof CalendarEventDraft, value: string | boolean) => void
  onAdd: () => void
  onRemove: (eventId: string) => void
}) {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="h-10 rounded-full border-white/15 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onRemove(event.id)}
                className="h-8 rounded-full px-3 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Title</p>
                <Input
                  value={event.title}
                  onChange={(input) => onChange(event.id, "title", input.target.value)}
                  className="border-white/10 bg-black/20 text-foreground"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Date</p>
                <Input
                  type="date"
                  value={event.date}
                  onChange={(input) => onChange(event.id, "date", input.target.value)}
                  className="border-white/10 bg-black/20 text-foreground"
                />
              </div>
              {!event.isAllDay ? (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Time</p>
                  <Input
                    type="time"
                    value={event.time}
                    onChange={(input) => onChange(event.id, "time", input.target.value)}
                    className="border-white/10 bg-black/20 text-foreground"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Description</p>
              <Textarea
                value={event.description}
                onChange={(input) => onChange(event.id, "description", input.target.value)}
                className="min-h-24 border-white/10 bg-black/20 text-foreground"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuspiciousCalendarManager() {
  const { user } = useAuth()
  const [loadingState, setLoadingState] = useState<"loading" | "ready" | "error">("loading")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [usingDefaults, setUsingDefaults] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [poyaEvents, setPoyaEvents] = useState<CalendarEventDraft[]>([])
  const [avuruduEvents, setAvuruduEvents] = useState<CalendarEventDraft[]>([])

  useEffect(() => {
    if (!user) return

    const currentUser = user
    let cancelled = false

    async function loadCalendar() {
      try {
        setLoadingState("loading")
        setError(null)
        const idToken = await currentUser.getIdToken()
        const response = await fetch(`/api/review/profiles?resource=calendar&year=${CALENDAR_YEAR}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Could not load the managed auspicious calendar.")
        }

        const payload = (await response.json()) as CalendarResponse
        if (cancelled) return

        setUsingDefaults(payload.calendar.usingDefaults)
        setPoyaEvents(payload.calendar.config.poyaEvents.map(seedToDraft))
        setAvuruduEvents(payload.calendar.config.avuruduEvents.map(seedToDraft))
        setLoadingState("ready")
      } catch (loadError) {
        if (cancelled) return
        setLoadingState("error")
        setError(loadError instanceof Error ? loadError.message : "Could not load the managed auspicious calendar.")
      }
    }

    void loadCalendar()
    return () => {
      cancelled = true
    }
  }, [user])

  function updateEvent(
    category: "poya" | "avurudu",
    eventId: string,
    field: keyof CalendarEventDraft,
    value: string | boolean,
  ) {
    const updater = (current: CalendarEventDraft[]) =>
      current.map((event) => (event.id === eventId ? { ...event, [field]: value } : event))

    if (category === "poya") {
      setPoyaEvents(updater)
      return
    }

    setAvuruduEvents(updater)
  }

  function addEvent(category: "poya" | "avurudu") {
    if (category === "poya") {
      setPoyaEvents((current) => [...current, emptyDraft("poya")])
      return
    }

    setAvuruduEvents((current) => [...current, emptyDraft("avurudu")])
  }

  function removeEvent(category: "poya" | "avurudu", eventId: string) {
    if (category === "poya") {
      setPoyaEvents((current) => current.filter((event) => event.id !== eventId))
      return
    }

    setAvuruduEvents((current) => current.filter((event) => event.id !== eventId))
  }

  const hasInvalidRows = useMemo(() => {
    const allEvents = [...poyaEvents, ...avuruduEvents]
    return allEvents.some((event) => !event.title.trim() || !event.description.trim() || !event.date.trim() || (!event.isAllDay && !event.time.trim()))
  }, [avuruduEvents, poyaEvents])

  async function saveCalendar() {
    if (!user || hasInvalidRows) return

    try {
      setSaveState("saving")
      setError(null)
      const idToken = await user.getIdToken()
      const response = await fetch(`/api/review/profiles?resource=calendar&year=${CALENDAR_YEAR}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poyaEvents: poyaEvents.map((event) => draftToSeed(event, "poya")).filter(Boolean),
          avuruduEvents: avuruduEvents.map((event) => draftToSeed(event, "avurudu")).filter(Boolean),
        }),
      })

      if (!response.ok) {
        throw new Error("Could not save the managed auspicious calendar.")
      }

      const payload = (await response.json()) as CalendarResponse
      setUsingDefaults(payload.calendar.usingDefaults)
      setPoyaEvents(payload.calendar.config.poyaEvents.map(seedToDraft))
      setAvuruduEvents(payload.calendar.config.avuruduEvents.map(seedToDraft))
      setSaveState("saved")
    } catch (saveError) {
      setSaveState("error")
      setError(saveError instanceof Error ? saveError.message : "Could not save the managed auspicious calendar.")
    }
  }

  async function resetCalendar() {
    if (!user) return

    try {
      setSaveState("saving")
      setError(null)
      const idToken = await user.getIdToken()
      const response = await fetch(`/api/review/profiles?resource=calendar&year=${CALENDAR_YEAR}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Could not reset the managed auspicious calendar.")
      }

      const payload = (await response.json()) as CalendarResponse
      setUsingDefaults(payload.calendar.usingDefaults)
      setPoyaEvents(payload.calendar.config.poyaEvents.map(seedToDraft))
      setAvuruduEvents(payload.calendar.config.avuruduEvents.map(seedToDraft))
      setSaveState("saved")
    } catch (resetError) {
      setSaveState("error")
      setError(resetError instanceof Error ? resetError.message : "Could not reset the managed auspicious calendar.")
    }
  }

  return (
    <Card className="border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-foreground">Calendar management</CardTitle>
            <CardDescription className="leading-6 text-muted-foreground">
              Update the 2026 Poya and Avurudu event schedule that powers both dashboard cards and scheduled reminders.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-3 py-1",
              usingDefaults
                ? "border-white/10 bg-white/[0.04] text-muted-foreground"
                : "border-primary/30 bg-primary/12 text-primary",
            )}
          >
            <CalendarDays className="mr-2 h-3.5 w-3.5" />
            {usingDefaults ? "Using defaults" : "Custom calendar active"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {loadingState === "loading" ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
              Loading calendar configuration...
            </div>
          </div>
        ) : null}

        {loadingState === "ready" ? (
          <>
            <SectionEditor
              title="Poya days"
              description="All-day cultural reminders. These will show as calendar-day cards and morning alerts."
              events={poyaEvents}
              onChange={(eventId, field, value) => updateEvent("poya", eventId, field, value)}
              onAdd={() => addEvent("poya")}
              onRemove={(eventId) => removeEvent("poya", eventId)}
            />

            <SectionEditor
              title="Avurudu nekath"
              description="Timed seasonal alerts for New Year observances like Udawa, Lipa gini melaweema, and Ganu denu."
              events={avuruduEvents}
              onChange={(eventId, field, value) => updateEvent("avurudu", eventId, field, value)}
              onAdd={() => addEvent("avurudu")}
              onRemove={(eventId) => removeEvent("avurudu", eventId)}
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => void saveCalendar()}
                disabled={saveState === "saving" || hasInvalidRows}
                className="h-11 rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {saveState === "saving" ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Saving calendar...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save calendar
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void resetCalendar()}
                disabled={saveState === "saving"}
                className="h-11 rounded-full border-white/15 bg-white/[0.04] font-semibold text-foreground hover:bg-white/[0.08]"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to defaults
              </Button>
            </div>

            {hasInvalidRows ? (
              <p className="text-sm text-amber-200">Fill title, description, date, and time before saving.</p>
            ) : null}
          </>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-4 text-sm text-rose-100">{error}</div>
        ) : null}
      </CardContent>
    </Card>
  )
}
