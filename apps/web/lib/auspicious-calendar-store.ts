import "server-only"

import { getFirebaseAdminDb } from "@/lib/firebase-admin"
import {
  getDefaultAuspiciousCalendarConfig,
  getUpcomingAuspiciousEvents,
  type AuspiciousCalendarConfig,
  type StaticEventSeed,
} from "@/lib/auspicious-events"

const CALENDAR_COLLECTION = "auspiciousCalendarYears"

type FirestoreCalendarRecord = {
  poyaEvents?: unknown
  avuruduEvents?: unknown
}

function normalizeStartsAt(value: unknown) {
  if (!Array.isArray(value) || value.length < 3) return null

  const numeric = value.slice(0, 5).map((part, index) => {
    if (typeof part === "number" && Number.isFinite(part)) return part
    const parsed = Number(part)
    return Number.isNaN(parsed) ? (index < 3 ? NaN : 0) : parsed
  })

  if (numeric.slice(0, 3).some((part) => Number.isNaN(part))) return null

  return [
    numeric[0],
    numeric[1],
    numeric[2],
    numeric[3] ?? 0,
    numeric[4] ?? 0,
  ] as StaticEventSeed["startsAt"]
}

function normalizeSeed(seed: unknown, category: StaticEventSeed["category"], year: number): StaticEventSeed | null {
  if (!seed || typeof seed !== "object") return null

  const raw = seed as Record<string, unknown>
  const title = typeof raw.title === "string" ? raw.title.trim() : ""
  const description = typeof raw.description === "string" ? raw.description.trim() : ""
  const startsAt = normalizeStartsAt(raw.startsAt)

  if (!title || !description || !startsAt) return null

  return {
    id:
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id.trim()
        : `${category}-${year}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    category,
    title,
    description,
    startsAt,
    isAllDay: Boolean(raw.isAllDay),
  } satisfies StaticEventSeed
}

function normalizeSeedList(seeds: unknown, category: StaticEventSeed["category"], year: number) {
  if (!Array.isArray(seeds)) return []

  return seeds
    .map((seed) => normalizeSeed(seed, category, year))
    .filter((seed): seed is StaticEventSeed => seed !== null)
}

export async function getAuspiciousCalendarConfigForYear(year: number) {
  const defaults = getDefaultAuspiciousCalendarConfig(year)
  const snapshot = await getFirebaseAdminDb().collection(CALENDAR_COLLECTION).doc(String(year)).get()

  if (!snapshot.exists) {
    return {
      year,
      usingDefaults: true,
      config: defaults,
    }
  }

  const record = snapshot.data() as FirestoreCalendarRecord
  const config: AuspiciousCalendarConfig = {
    poyaEvents: normalizeSeedList(record.poyaEvents, "poya", year),
    avuruduEvents: normalizeSeedList(record.avuruduEvents, "avurudu", year),
  }

  return {
    year,
    usingDefaults: false,
    config: {
      poyaEvents: config.poyaEvents.length ? config.poyaEvents : defaults.poyaEvents,
      avuruduEvents: config.avuruduEvents.length ? config.avuruduEvents : defaults.avuruduEvents,
    },
  }
}

export async function saveAuspiciousCalendarConfigForYear(year: number, config: AuspiciousCalendarConfig) {
  await getFirebaseAdminDb()
    .collection(CALENDAR_COLLECTION)
    .doc(String(year))
    .set({
      poyaEvents: config.poyaEvents,
      avuruduEvents: config.avuruduEvents,
      updatedAt: new Date().toISOString(),
    })

  return {
    year,
    usingDefaults: false,
    config,
  }
}

export async function resetAuspiciousCalendarConfigForYear(year: number) {
  await getFirebaseAdminDb().collection(CALENDAR_COLLECTION).doc(String(year)).delete()
  return getAuspiciousCalendarConfigForYear(year)
}

export async function getUpcomingAuspiciousEventsFromStore(now = new Date(), limit = 5) {
  const calendar = await getAuspiciousCalendarConfigForYear(now.getFullYear())
  return getUpcomingAuspiciousEvents(now, limit, calendar.config)
}
