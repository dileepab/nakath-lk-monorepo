import { NextResponse } from "next/server"

import {
  getAuspiciousCalendarConfigForYear,
  resetAuspiciousCalendarConfigForYear,
  saveAuspiciousCalendarConfigForYear,
} from "@/lib/auspicious-calendar-store"
import { type AuspiciousCalendarConfig, type StaticEventSeed } from "@/lib/auspicious-events"
import { getFirebaseAdminAuth, getFirebaseAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin"
import { reviewQueueItemFromDoc } from "@/lib/review-api"
import { hasReviewerAccess, resolveReviewerRole } from "@/lib/reviewer-role"

function extractBearerToken(header: string | null) {
  if (!header?.startsWith("Bearer ")) return null
  return header.slice("Bearer ".length)
}

function isCalendarRequest(request: Request) {
  return new URL(request.url).searchParams.get("resource") === "calendar"
}

function parseYear(request: Request) {
  const requestedYear = Number(new URL(request.url).searchParams.get("year") ?? "2026")
  if (!Number.isFinite(requestedYear)) return 2026
  return Math.max(2026, Math.min(2035, requestedYear))
}

function normalizeStartsAt(value: unknown) {
  if (!Array.isArray(value) || value.length < 3) return null

  const numbers = value.slice(0, 5).map((part, index) => {
    if (typeof part === "number" && Number.isFinite(part)) return part
    const parsed = Number(part)
    return Number.isNaN(parsed) ? (index < 3 ? NaN : 0) : parsed
  })

  if (numbers.slice(0, 3).some((part) => Number.isNaN(part))) return null

  return [
    numbers[0],
    numbers[1],
    numbers[2],
    numbers[3] ?? 0,
    numbers[4] ?? 0,
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

async function authenticateReviewer(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Firebase Admin SDK is not configured." }, { status: 503 }),
    }
  }

  const token = extractBearerToken(request.headers.get("authorization"))
  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Missing bearer token." }, { status: 401 }),
    }
  }

  try {
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token)
    const role = resolveReviewerRole(decoded)

    if (!hasReviewerAccess(role)) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: "Reviewer access required." }, { status: 403 }),
      }
    }

    return { ok: true as const, decoded, role }
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Could not load review queue." }, { status: 500 }),
    }
  }
}

export async function GET(request: Request) {
  const auth = await authenticateReviewer(request)
  if (!auth.ok) {
    return auth.response
  }

  if (isCalendarRequest(request)) {
    const year = parseYear(request)
    const calendar = await getAuspiciousCalendarConfigForYear(year)

    return NextResponse.json({
      role: auth.role,
      calendar,
    })
  }

  try {
    const snapshot = await getFirebaseAdminDb().collection("profiles").orderBy("updatedAt", "desc").limit(30).get()

    const profiles = snapshot.docs.map((doc) => reviewQueueItemFromDoc(doc.id, doc.data()))

    return NextResponse.json({ role: auth.role, profiles })
  } catch {
    return NextResponse.json({ error: "Could not load review queue." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await authenticateReviewer(request)
  if (!auth.ok) {
    return auth.response
  }

  if (!isCalendarRequest(request)) {
    return NextResponse.json({ error: "Unsupported review action." }, { status: 405 })
  }

  const year = parseYear(request)
  const payload = (await request.json().catch(() => null)) as Partial<AuspiciousCalendarConfig> | null
  const config: AuspiciousCalendarConfig = {
    poyaEvents: normalizeSeedList(payload?.poyaEvents, "poya", year),
    avuruduEvents: normalizeSeedList(payload?.avuruduEvents, "avurudu", year),
  }

  const saved = await saveAuspiciousCalendarConfigForYear(year, config)
  return NextResponse.json({ role: auth.role, calendar: saved })
}

export async function DELETE(request: Request) {
  const auth = await authenticateReviewer(request)
  if (!auth.ok) {
    return auth.response
  }

  if (!isCalendarRequest(request)) {
    return NextResponse.json({ error: "Unsupported review action." }, { status: 405 })
  }

  const year = parseYear(request)
  const calendar = await resetAuspiciousCalendarConfigForYear(year)
  return NextResponse.json({ role: auth.role, calendar })
}
