import { createSriLankaDate, getRahuKaalayaForDate, getSriLankaDateParts, SRI_LANKA_TIME_ZONE } from "@acme/core"

export type AuspiciousEventCategory = "rahu" | "poya" | "avurudu"

export type AuspiciousEvent = {
  id: string
  category: AuspiciousEventCategory
  title: string
  description: string
  startsAt: Date
  isAllDay?: boolean
}

export type StaticEventSeed = Omit<AuspiciousEvent, "startsAt"> & {
  startsAt: [year: number, monthIndex: number, day: number, hour?: number, minute?: number]
}

export type AuspiciousCalendarConfig = {
  poyaEvents: StaticEventSeed[]
  avuruduEvents: StaticEventSeed[]
}

export const poyaEvents2026: StaticEventSeed[] = [
  {
    id: "poya-2026-04-01",
    category: "poya",
    title: "Bak Full Moon Poya Day",
    description: "A public holiday across Sri Lanka. Good moment for a gentler dashboard rhythm and reminder.",
    startsAt: [2026, 3, 1],
    isAllDay: true,
  },
  {
    id: "poya-2026-05-01",
    category: "poya",
    title: "Vesak Full Moon Poya Day",
    description: "Vesak day reminder for users who prefer spiritual and family calendar alerts.",
    startsAt: [2026, 4, 1],
    isAllDay: true,
  },
  {
    id: "poya-2026-05-30",
    category: "poya",
    title: "Adhi Poson Full Moon Poya Day",
    description: "A second Poya in May 2026, useful as a special calendar highlight.",
    startsAt: [2026, 4, 30],
    isAllDay: true,
  },
  {
    id: "poya-2026-06-29",
    category: "poya",
    title: "Poson Full Moon Poya Day",
    description: "A strong cultural reminder point for the middle of the year.",
    startsAt: [2026, 5, 29],
    isAllDay: true,
  },
  {
    id: "poya-2026-07-29",
    category: "poya",
    title: "Esala Full Moon Poya Day",
    description: "Useful for users planning family visits and temple time around major observances.",
    startsAt: [2026, 6, 29],
    isAllDay: true,
  },
  {
    id: "poya-2026-08-27",
    category: "poya",
    title: "Nikini Full Moon Poya Day",
    description: "Keeps the dashboard feeling rooted in the local calendar beyond launch season.",
    startsAt: [2026, 7, 27],
    isAllDay: true,
  },
  {
    id: "poya-2026-09-26",
    category: "poya",
    title: "Binara Full Moon Poya Day",
    description: "A simple monthly reminder option for users who prefer gentle cultural prompts.",
    startsAt: [2026, 8, 26],
    isAllDay: true,
  },
  {
    id: "poya-2026-10-25",
    category: "poya",
    title: "Vap Full Moon Poya Day",
    description: "Useful for keeping the calendar card active even outside matchmaking actions.",
    startsAt: [2026, 9, 25],
    isAllDay: true,
  },
  {
    id: "poya-2026-11-24",
    category: "poya",
    title: "Il Full Moon Poya Day",
    description: "Another monthly reminder users can opt into without relying on match activity alone.",
    startsAt: [2026, 10, 24],
    isAllDay: true,
  },
  {
    id: "poya-2026-12-23",
    category: "poya",
    title: "Unduvap Full Moon Poya Day",
    description: "Year-end Poya alert for users who stay engaged through the full calendar cycle.",
    startsAt: [2026, 11, 23],
    isAllDay: true,
  },
]

export const avuruduEvents2026: StaticEventSeed[] = [
  {
    id: "avurudu-2026-parana-awurudu",
    category: "avurudu",
    title: "Parana Avurudu",
    description: "Old-year closing observance on the day before New Year.",
    startsAt: [2026, 3, 13, 7, 0],
  },
  {
    id: "avurudu-2026-udawa",
    category: "avurudu",
    title: "Aluth Avurudu Udawa",
    description: "New Year dawn. A strong seasonal moment for dashboard and push reminders.",
    startsAt: [2026, 3, 14, 9, 32],
  },
  {
    id: "avurudu-2026-lipa-gini",
    category: "avurudu",
    title: "Lipa gini melaweema",
    description: "The auspicious time for lighting the hearth and preparing kiribath.",
    startsAt: [2026, 3, 14, 10, 41],
  },
  {
    id: "avurudu-2026-ganu-denu",
    category: "avurudu",
    title: "Ganu denu / Weda allima",
    description: "Auspicious time for transactions and beginning work in the New Year.",
    startsAt: [2026, 3, 14, 12, 5],
  },
  {
    id: "avurudu-2026-hisa-thel",
    category: "avurudu",
    title: "Hisa thel gema",
    description: "Traditional oil anointing time for the New Year season.",
    startsAt: [2026, 3, 15, 6, 54],
  },
]

function toDate([year, monthIndex, day, hour = 0, minute = 0]: StaticEventSeed["startsAt"]) {
  return createSriLankaDate(year, monthIndex, day, hour, minute)
}

function startOfDay(value: Date) {
  const parts = getSriLankaDateParts(value)
  return createSriLankaDate(parts.year, parts.monthIndex, parts.day, 0, 0)
}

function isSameDay(left: Date, right: Date) {
  const leftParts = getSriLankaDateParts(left)
  const rightParts = getSriLankaDateParts(right)

  return leftParts.year === rightParts.year && leftParts.monthIndex === rightParts.monthIndex && leftParts.day === rightParts.day
}

function getNextRahuStart(now: Date) {
  for (let offset = 0; offset < 7; offset += 1) {
    const candidateDate = new Date(now)
    candidateDate.setDate(now.getDate() + offset)

    const window = getRahuKaalayaForDate(candidateDate)
    if (window.start >= now) {
      return {
        id: `rahu-${window.start.toISOString()}`,
        category: "rahu" as const,
        title: "Rahu kalaya starts",
        description:
          offset === 0
            ? "The next inauspicious period for new beginnings starts later today."
            : "Tomorrow's Rahu kalaya window is coming up.",
        startsAt: window.start,
      }
    }
  }

  return null
}

function materializeStaticEvents(seeds: StaticEventSeed[]) {
  return seeds.map((seed) => ({
    ...seed,
    startsAt: toDate(seed.startsAt),
  }))
}

export function getDefaultAuspiciousCalendarConfig(year: number): AuspiciousCalendarConfig {
  if (year === 2026) {
    return {
      poyaEvents: poyaEvents2026,
      avuruduEvents: avuruduEvents2026,
    }
  }

  return {
    poyaEvents: [],
    avuruduEvents: [],
  }
}

export function getUpcomingAuspiciousEvents(
  now = new Date(),
  limit = 5,
  calendarConfig?: Partial<AuspiciousCalendarConfig>,
): AuspiciousEvent[] {
  const today = startOfDay(now)
  const nextRahu = getNextRahuStart(now)
  const currentYear = getSriLankaDateParts(now).year
  const defaults = getDefaultAuspiciousCalendarConfig(currentYear)
  const resolvedCalendar: AuspiciousCalendarConfig = {
    poyaEvents: calendarConfig?.poyaEvents ?? defaults.poyaEvents,
    avuruduEvents: calendarConfig?.avuruduEvents ?? defaults.avuruduEvents,
  }

  const staticEvents = [
    ...materializeStaticEvents(resolvedCalendar.avuruduEvents),
    ...materializeStaticEvents(resolvedCalendar.poyaEvents),
  ]
    .filter((event) => event.startsAt >= today || isSameDay(event.startsAt, now))

  const merged = [...(nextRahu ? [nextRahu] : []), ...staticEvents]
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())
    .slice(0, limit)

  return merged
}

export function formatAuspiciousEventDate(event: AuspiciousEvent) {
  const now = new Date()
  const today = startOfDay(now)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const eventDay = startOfDay(event.startsAt)

  if (event.isAllDay) {
    if (eventDay.getTime() === today.getTime()) {
      return "Today"
    }

    if (eventDay.getTime() === tomorrow.getTime()) {
      return "Tomorrow"
    }

    return event.startsAt.toLocaleDateString("en-LK", {
      timeZone: SRI_LANKA_TIME_ZONE,
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const dayLabel =
    eventDay.getTime() === today.getTime()
      ? "Today"
      : eventDay.getTime() === tomorrow.getTime()
        ? "Tomorrow"
        : event.startsAt.toLocaleDateString("en-LK", {
            timeZone: SRI_LANKA_TIME_ZONE,
            weekday: "short",
            month: "short",
            day: "numeric",
          })

  return `${dayLabel} • ${event.startsAt.toLocaleTimeString("en-LK", {
    timeZone: SRI_LANKA_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`
}

export function getAuspiciousEventTone(category: AuspiciousEventCategory) {
  switch (category) {
    case "rahu":
      return {
        badge: "border-rose-400/25 bg-rose-500/12 text-rose-100",
        label: "Daily timing",
      }
    case "poya":
      return {
        badge: "border-sky-400/25 bg-sky-500/12 text-sky-100",
        label: "Poya day",
      }
    case "avurudu":
      return {
        badge: "border-amber-400/25 bg-amber-500/12 text-amber-100",
        label: "Seasonal nakath",
      }
  }
}
