import "server-only"

import { FieldValue } from "firebase-admin/firestore"

import { getFailedTokensToPrune, pruneProfileTokens } from "@/lib/fcm-token-hygiene"
import { buildCalendarNotificationCopy } from "@/lib/notification-copy"
import { getUpcomingAuspiciousEvents, type AuspiciousEvent } from "@/lib/auspicious-events"
import { getFirebaseAdminDb, getFirebaseAdminMessaging } from "@/lib/firebase-admin"
import {
  createSriLankaDate,
  getRahuKaalayaForDate,
  getSriLankaDateParts,
  mergeProfileDraft,
  type ProfileDraft,
} from "@acme/core"

type ReminderCandidate = {
  userId: string
  tokens: string[]
  dedupeKey: string
  category: "rahu" | "poya" | "avurudu"
  event: AuspiciousEvent
  title: string
  body: string
}

type DispatchOptions = {
  now?: Date
  dryRun?: boolean
}

type FirestoreReminderRecord = {
  draft?: Partial<ProfileDraft>
  fcmTokens?: string[]
}

const SCHEDULER_CADENCE_MINUTES = 5
const RAHU_LEAD_MINUTES = 10
const AVURUDU_LEAD_MINUTES = 15
const POYA_REMINDER_HOUR = 6

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60 * 1000)
}

function isWithinSendWindow(now: Date, target: Date, cutoff?: Date) {
  const time = now.getTime()
  const start = target.getTime()
  const end = Math.min(
    start + SCHEDULER_CADENCE_MINUTES * 60 * 1000,
    cutoff?.getTime() ?? Number.POSITIVE_INFINITY,
  )

  return time >= start && time < end
}

function startOfDay(value: Date) {
  const parts = getSriLankaDateParts(value)
  return createSriLankaDate(parts.year, parts.monthIndex, parts.day, 0, 0)
}

function buildDueRemindersForProfile(userId: string, draft: ProfileDraft, tokens: string[], now: Date) {
  if (!tokens.length) return [] as ReminderCandidate[]

  const due: ReminderCandidate[] = []
  const today = startOfDay(now)
  const todayLabel = today.toISOString().slice(0, 10)
  const events = getUpcomingAuspiciousEvents(now, 8)

  if (draft.alerts.rahuKalaya) {
    const rahu = events.find((event) => event.category === "rahu")
    if (rahu) {
      const rahuWindow = getRahuKaalayaForDate(rahu.startsAt)
      const sendAt = addMinutes(rahuWindow.start, -RAHU_LEAD_MINUTES)

      if (isWithinSendWindow(now, sendAt, rahuWindow.start)) {
        const copy = buildCalendarNotificationCopy(rahu, draft, now)
        due.push({
          userId,
          tokens,
          dedupeKey: `${userId}:rahu:${todayLabel}`,
          category: "rahu",
          event: rahu,
          title: copy.title,
          body: copy.body,
        })
      }
    }
  }

  if (draft.alerts.poyaDays) {
    const poya = events.find((event) => event.category === "poya" && event.isAllDay && startOfDay(event.startsAt).getTime() === today.getTime())
    if (poya) {
      const todayParts = getSriLankaDateParts(today)
      const sendAt = createSriLankaDate(todayParts.year, todayParts.monthIndex, todayParts.day, POYA_REMINDER_HOUR, 0)

      if (isWithinSendWindow(now, sendAt)) {
        const copy = buildCalendarNotificationCopy(poya, draft, now)
        due.push({
          userId,
          tokens,
          dedupeKey: `${userId}:poya:${todayLabel}`,
          category: "poya",
          event: poya,
          title: copy.title,
          body: copy.body,
        })
      }
    }
  }

  if (draft.alerts.avuruduNekath) {
    const avuruduEvents = events.filter((event) => {
      if (event.category !== "avurudu") return false
      const sendAt = addMinutes(event.startsAt, -AVURUDU_LEAD_MINUTES)
      return isWithinSendWindow(now, sendAt, event.startsAt)
    })

    avuruduEvents.forEach((event) => {
      const copy = buildCalendarNotificationCopy(event, draft, now)
      due.push({
        userId,
        tokens,
        dedupeKey: `${userId}:avurudu:${event.id}`,
        category: "avurudu",
        event,
        title: copy.title,
        body: copy.body,
      })
    })
  }

  return due
}

export async function dispatchAuspiciousReminders(options?: DispatchOptions) {
  const now = options?.now ?? new Date()
  const dryRun = Boolean(options?.dryRun)
  const db = getFirebaseAdminDb()
  const snapshot = await db.collection("profiles").get()

  const allCandidates = snapshot.docs.flatMap((document) => {
    const record = document.data() as FirestoreReminderRecord
    const draft = mergeProfileDraft(record.draft)
    const tokens = Array.from(new Set((record.fcmTokens ?? []).filter(Boolean)))

    return buildDueRemindersForProfile(document.id, draft, tokens, now)
  })

  const dueReminders: ReminderCandidate[] = []
  for (const candidate of allCandidates) {
    const dispatchSnapshot = await db.collection("reminderDispatches").doc(candidate.dedupeKey).get()
    if (!dispatchSnapshot.exists) {
      dueReminders.push(candidate)
    }
  }

  if (dryRun) {
    return {
      now: now.toISOString(),
      mode: "dry-run",
      scannedProfiles: snapshot.size,
      dueCount: dueReminders.length,
      dueReminders: dueReminders.map((candidate) => ({
        userId: candidate.userId,
        category: candidate.category,
        title: candidate.title,
        body: candidate.body,
        tokens: candidate.tokens.length,
        dedupeKey: candidate.dedupeKey,
      })),
    }
  }

  let sentCount = 0
  let failureCount = 0
  let prunedTokenCount = 0
  const messaging = getFirebaseAdminMessaging()

  for (const candidate of dueReminders) {
    const result = await messaging.sendEachForMulticast({
      tokens: candidate.tokens,
      notification: {
        title: candidate.title,
        body: candidate.body,
      },
      data: {
        type: "auspicious-reminder",
        category: candidate.category,
        eventId: candidate.event.id,
      },
      webpush: {
        fcmOptions: {
          link: "/dashboard",
        },
      },
    })

    const successCount = result.responses.filter((response) => response.success).length
    const failedTokens = result.responses
      .map((response, index) => (response.success ? null : candidate.tokens[index]))
      .filter((token): token is string => Boolean(token))
    const prunedTokens = getFailedTokensToPrune(candidate.tokens, result)

    if (successCount > 0) {
      sentCount += successCount
      await db.collection("reminderDispatches").doc(candidate.dedupeKey).set({
        userId: candidate.userId,
        category: candidate.category,
        eventId: candidate.event.id,
        title: candidate.title,
        body: candidate.body,
        sentAt: FieldValue.serverTimestamp(),
      })
    }

    if (failedTokens.length) {
      failureCount += failedTokens.length
    }

    if (prunedTokens.length) {
      prunedTokenCount += prunedTokens.length
      await pruneProfileTokens(candidate.userId, prunedTokens)
    }
  }

  return {
    now: now.toISOString(),
    mode: "send",
    scannedProfiles: snapshot.size,
    dueCount: dueReminders.length,
    sentCount,
    failureCount,
    prunedTokenCount,
  }
}
